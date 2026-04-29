# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Panel Incidentes** is an operational incident panel for extortion/organized crime intelligence. It exposes a FastAPI backend consumed by a React frontend, allowing analysts to review cases one by one. It complements an existing analytical dashboard (`mas089-auth` + Streamlit in a separate repo) but manages its own auth independently.

## Repository Structure

```
panel-incidentes/
├── backend/
│   ├── api/
│   │   ├── main.py          # FastAPI app — all endpoints, Pydantic models, pool
│   │   ├── .env             # DB credentials + JWT secret (never commit)
│   │   └── requirements.txt
│   └── db/
│       ├── migrations/      # SQL files applied in sorted order (YYYYMMDD_NNN_desc.sql)
│       ├── scripts/
│       │   └── bootstrap_db.sh   # applies migrations on docker-compose up
│       └── create_app_roles.sql
└── frontend/
    ├── src/
    │   ├── App.jsx                    # Routes + shared state (vista, tema, sidebarAbierta)
    │   ├── components/
    │   │   ├── Sidebar/
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── FiltrosPage.jsx
    │   │   ├── DetalleIncidentePage.jsx
    │   │   └── LoginPage.jsx
    │   ├── hooks/
    │   │   └── useIncidentes.js       # wraps incidentesService with loading/error state
    │   └── services/
    │       └── api.js                 # BASE_URL, incidentesService, token handling
    ├── package.json
    └── vite.config.js
```

## Development Commands

### Database

```bash
cd backend/db
docker-compose up
# PostgreSQL on port 5433 (host) → 5432 (container)
# DB: bd_089 / user: postgres / password: postgres (dev only)
```

### Backend API

```bash
cd backend/api

# Windows
.panel\Scripts\activate
# Linux/Mac
source .panel/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload
# API on http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
npm run lint    # ESLint check
npm run build   # production build
```

### Environment Setup

**Backend** — create `backend/api/.env`:
```
DB_HOST=localhost
DB_PORT=5433
DB_NAME=bd_089
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET_KEY=<python -c "import secrets; print(secrets.token_hex(32))">
JWT_EXPIRE_HOURS=8
DATA_DEFAULT_LIMIT=500
DATA_MAX_LIMIT=2000
```

**Frontend** — create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```
Without this file, `api.js` defaults to `http://localhost:8000`. Keep the file explicit when switching between local, staging, and production URLs.

## Architecture

```
React (Vite, port 5173)
  └── fetch via incidentesService (api.js)
        └── FastAPI (main.py, port 8000)
              ├── CORSMiddleware — allows localhost:5173
              ├── OAuth2PasswordBearer — extracts JWT from Authorization header
              ├── psycopg_pool (sync pool, min=1, max=10)
              └── PostgreSQL 16 (Docker, port 5433)
                    ├── public schema   — users, extortion_type
                    └── analytics schema — vw_report_conversation_panel
```

**Authentication:** JWT via `public.users` table. Roles: `admin`, `monitor`, `operativo`. `ProtectedRoute` checks `localStorage.getItem('token')`. On 401, `api.js` clears all token keys and redirects to `/login`. To force re-login during development, run `localStorage.clear()` in browser devtools.

**DB roles:**
- `mas089_sync_rw` — INSERT/UPDATE (AI sync pipeline, external)
- `mas089_dashboard_ro` — SELECT on tables and all views (this API uses this role)

**Routing & state (App.jsx):** Two routes share state (`vista`, `tema`, `sidebarAbierta`) defined in `App`:
- `/` — renders `FiltrosPage`, `Inicio`, or `Explorador` based on `vista` state
- `/incidente/:id` — renders `DetalleIncidentePage`; its Sidebar receives `onChangeVista={(v) => { setVista(v); navigate('/'); }}` so sidebar navigation works from the detail page

**Data flow:** `useIncidentes` hook wraps `incidentesService` with loading/error state. Detail page calls `incidentesService.getById` directly.

## API Endpoints

All endpoints except `/health` and `/auth/login` require `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/login` | No | OAuth2 form login → returns JWT + role |
| `GET` | `/health` | No | DB connectivity check |
| `GET` | `/data` | Yes | List incidentes from `analytics.vw_report_conversation_panel` |
| `GET` | `/data/{id_conv}` | Yes | Single incidente detail — 404 if not found |
| `GET` | `/extortion-types` | Yes | Catalog from `public.extortion_type` |
| `POST` | `/users` | Admin only | Create a new user |

**`/data` query params:** `fecha`, `fecha_inicio`, `fecha_fin` (date strings), `hora`, `minutos` (exact time ints), `hora_inicio`, `minutos_inicio`, `hora_fin`, `minutos_fin` (time range ints), `tipo_extorsion` (string, matched by id or normalized name), `id_conv` (string), `limit` (bounded result count).

**`/auth/login` body:** `application/x-www-form-urlencoded` with `username` and `password`.

## Pydantic Models

- `IncidenteItem` — all columns of `analytics.vw_report_conversation_panel`. `transcription` typed `Any` (jsonb, variable structure). Money fields use `Decimal`.
- `TipoExtorsion` — `id_extortion`, `name`, `description`.
- `TokenResponse` — `access_token`, `token_type`, `role`.
- `UsuarioActual` — internal dep: `username`, `role`.
- `UsuarioCreate` / `UsuarioResponse` — for `POST /users` (admin only).

Both backend and frontend normalize `extortion_name` to fix `?` encoding artifacts that may appear in DB data.

## User Management

`scripts/create_user.py` creates or updates users in `public.users`:

```bash
cd backend/api
python scripts/create_user.py --username admin --email admin@example.local --password <pass> --role admin
python scripts/create_user.py --username admin --email admin@example.local --password <new-pass> --role admin --update
# roles: admin | monitor | operativo
```

Passwords stored as bcrypt hashes.

## Database Migrations

Applied automatically by `bootstrap_db.sh` on `docker-compose up`. Naming: `YYYYMMDD_NNN_description.sql`. Baseline is `000_schema_create.sql`. Applied versions tracked in `public.schema_migrations`.

The key view is `analytics.vw_report_conversation_panel` (migration `20260408_011`) — filters `public.vw_dashboard_base` to rows where `report_generated = true`.

## Line Endings

`.gitattributes` enforces LF for `.sh`, `.sql`, `.env`, and config files, preventing `bootstrap_db.sh` from failing inside Linux containers when cloned on Windows. After a collaborator pulls `.gitattributes` for the first time:

```bash
git rm --cached -r .
git reset --hard HEAD
```

## Relationship with Docker-MAS-089

This project shares the same PostgreSQL database (`bd_089`) as the `Docker-MAS-089` repo. That repo owns the sync pipeline and the `public` schema views. This project only reads via `analytics` schema views and `public.extortion_type`.

## Production deployment

The app runs at `https://panel-incidentes.doti-ia.com` using MAS_089's nginx and Docker infrastructure. The production stack lives at `~/panel-incidentes/` on the server.

**Key production files (not for local dev):**
- `~/panel-incidentes/docker-compose.yml` — production stack (joins MAS_089's external Docker networks)
- `~/panel-incidentes/.env` — production credentials; NOT `backend/api/.env` (that's local dev only)

**Networks (external, already exist in Docker):**
- `mas089_mas089-net` — nginx reaches the containers
- `database_default` — API reaches `mas089-postgres`

**DB role:** `mas089_panel_rw` — minimal grants: SELECT on `analytics.vw_report_conversation_panel` and `public.extortion_type`, SELECT+INSERT on `public.users`. Created by migration `20260427_027` in `Docker-MAS-089`.

**Auth:** Same `public.users` table as MAS_089's Streamlit dashboard. Same credentials work on both.

**nginx routing** (in `Docker-MAS-089/deployments/mas089/nginx/default.conf`):
- `location = /api/auth/login` → `panel-incidentes-api:8000/auth/login` (rate-limited)
- `location /api/` → strips `/api/` prefix → `panel-incidentes-api:8000`
- `location /` → `panel-incidentes-frontend:80`

All nginx upstreams use `resolver 127.0.0.11 valid=30s` + variable + `rewrite ... break` to avoid caching Docker container IPs.

**Production commands:**
```bash
cd ~/panel-incidentes
docker compose ps
docker compose up -d --build    # rebuild after code changes
docker compose restart api      # restart after .env changes only
```

**VITE_API_URL** is baked into the frontend bundle at build time as `https://panel-incidentes.doti-ia.com/api`. If the domain changes, rebuild the frontend.

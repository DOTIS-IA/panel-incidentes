# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Panel Incidentes** is an operational incident panel for extortion/organized crime intelligence. It complements an existing analytical dashboard (`mas089-auth` + Streamlit in a separate repo). This project exposes a FastAPI backend consumed by a React frontend, allowing analysts to review cases one by one.

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
    │   ├── main.jsx
    │   └── App.jsx
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

# Activate virtual environment
.panel/Scripts/activate        # Windows
source .panel/bin/activate     # Linux/Mac

pip install -r requirements.txt
python -m uvicorn main:app --reload
# API runs on http://localhost:8000
# Auto-generated docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# React runs on http://localhost:5173
```

### Environment Setup

Create `backend/api/.env`:
```
DB_HOST=localhost
DB_PORT=5433
DB_NAME=bd_089
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
JWT_EXPIRE_HOURS=8
```

## Architecture

```
React (Vite, port 5173)
  └── fetch + TanStack Query (planned)
        └── FastAPI (main.py, port 8000)
              ├── CORSMiddleware — allows localhost:5173
              ├── psycopg_pool (sync pool, min=1, max=10)
              └── PostgreSQL 16 (Docker, port 5433)
                    ├── public schema   — core tables + operational views
                    └── analytics schema — panel-specific views
```

**Authentication (planned):** JWT validation against `mas089-auth` microservice (external repo `Docker-MAS-089`). The JWT_SECRET_KEY must match between both services.

**DB roles:**
- `mas089_sync_rw` — INSERT/UPDATE (AI sync pipeline, external)
- `mas089_dashboard_ro` — SELECT on tables and all views (this API uses this role)

## API Endpoints

All endpoints are async. Pydantic models enforce response shape.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | DB connectivity check |
| `GET` | `/data` | List incidentes from `analytics.vw_report_conversation_panel` |
| `GET` | `/data/{id_conv}` | Single incidente detail — returns 404 if not found |
| `GET` | `/extortion-types` | Catalog from `public.extortion_type` — used to populate filters |

**`/data` query params:** `fecha` (date string), `tipo_extorsion` (int), `id_conv` (string)

## Pydantic Models

- `IncidenteItem` — response model for `/data` and `/data/{id_conv}`. Maps all columns of `analytics.vw_report_conversation_panel`. `transcription` is typed `Any` (jsonb with variable structure). Money fields use `Decimal`.
- `TipoExtorsion` — response model for `/extortion-types`. All fields non-nullable (mirrors DB constraints).

## Database Migrations

Migrations in `backend/db/migrations/` are applied automatically by `bootstrap_db.sh` on `docker-compose up`. Naming: `YYYYMMDD_NNN_description.sql`. The baseline is `000_schema_create.sql`. Applied versions are tracked in `public.schema_migrations`.

The key view for this panel is `analytics.vw_report_conversation_panel` (created in `20260408_011_...sql`) — it filters `public.vw_dashboard_base` to only rows where `report_generated = true`.

## Relationship with Docker-MAS-089

This project shares the same PostgreSQL database (`bd_089`) as the `Docker-MAS-089` repo (the analytical Streamlit dashboard). That repo owns the sync pipeline, the `mas089-auth` JWT microservice, and the `public` schema views. This project only reads data via `analytics` schema views and `public.extortion_type`.

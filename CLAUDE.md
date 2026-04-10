# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Panel Incidentes** is an incident tracking system for extortion/organized crime intelligence. It processes AI conversation transcriptions, generates structured reports, and exposes a FastAPI backend for a dashboard frontend.

## Development Commands

### Database

```bash
# Start PostgreSQL and run all migrations automatically
cd backend/db
docker-compose up

# Database runs on port 5433 (host) → 5432 (container)
# Database name: bd_089, credentials: postgres/postgres (dev)
```

### API

```bash
cd backend/api

# Install dependencies
pip install -r requirements.txt

# activate enviroment
.panel/Scripts/activate

# Run development server
python -m uvicorn main:app --reload

# Health check
curl http://localhost:8000/health
```

### Environment Setup

Create `backend/api/.env`:
```
DB_HOST=localhost
DB_PORT=5433
DB_NAME=bd_089
DB_USER=postgres
DB_PASSWORD=postgres
```

## Architecture

```
FastAPI (main.py)
  └── psycopg_pool (async connection pool, min=1, max=10)
        └── PostgreSQL 16 (Docker, port 5433)
              ├── public schema (core tables + operational views)
              └── analytics schema (dashboard-specific views)
```

**RBAC roles:**
- `mas089_sync_rw` — INSERT/UPDATE on data tables (for the AI sync pipeline)
- `mas089_dashboard_ro` — SELECT on tables and all views (for the dashboard)

## API Endpoints

- `GET /health` — Database connectivity check
- `GET /data` — Report conversation panel data with optional query params:
  - `fecha` — filter by event date
  - `tipo_extorsion` — filter by extortion type ID
  - `id_conv` — filter by conversation ID

## Database Schema

**Core tables:** `agents`, `conv_exec`, `conv_details`, `reports`, `conv_cost`, `extortion_type`, `users`

**Key views:**
- `public.vw_dashboard_base` — Main joined view (agents + costs + reports + extortion types)
- `analytics.vw_report_conversation_panel` — Filtered panel view used by `/data` endpoint (only where `report_generated=true`)
- `public.vw_report_quality`, `vw_ops_agent_quality_daily`, `vw_temporal_performance_daily` — Analytical aggregations

## Database Migrations

Migrations live in `backend/db/migrations/` and are applied automatically by `backend/db/scripts/bootstrap_db.sh` on `docker-compose up`. The script:

1. Applies `000_schema_create.sql` (baseline schema) if the schema doesn't exist
2. Tracks applied migrations in a `schema_migrations` table
3. Runs all `.sql` files in sorted order (naming convention: `YYYYMMDD_description.sql`)
4. Creates/updates app roles via `create_app_roles.sql`

To add a migration: create a new file in `migrations/` following the date-based naming convention. It will be picked up on the next `docker-compose up`.

#!/bin/sh

set -eu

DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-bd_089}"
DB_USER="${POSTGRES_USER:-postgres}"
export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"

psql_db() {
    psql \
        -v ON_ERROR_STOP=1 \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        "$@"
}

echo ">>> Esperando PostgreSQL en $DB_HOST:$DB_PORT/$DB_NAME..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
    sleep 2
done

mkdir -p /logs
touch /logs/sync_daemon.log

schema_exists="$(psql_db -tAc "SELECT to_regclass('public.agents') IS NOT NULL" | tr -d '[:space:]')"
if [ "$schema_exists" != "t" ]; then
    echo ">>> Aplicando schema base desde 000_schema_create.sql..."
    psql_db -f /sql/migrations/000_schema_create.sql
else
    echo ">>> Schema base ya existe; se reutiliza la base local."
fi

echo ">>> Registrando baseline absorbido por 000_schema_create.sql..."
psql_db <<'SQL'
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version text PRIMARY KEY,
    description text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_migrations (version, description)
VALUES
    ('20260311_000_live_baseline', 'Baseline captured from live bd_089 before remediation'),
    ('20260311_001_expand_reports_multivalue_fields', 'Add multivalue report fields'),
    ('20260312_002_add_reports_procedente', 'Add procedente boolean flag to reports'),
    ('20260312_003_add_procedente_to_dashboard_views', 'Expose procedente in dashboard views'),
    ('20260312_004_rename_procedente_to_is_actionable', 'Rename procedente to is_actionable'),
    ('20260313_005_rebuild_views_without_legacy_columns', 'Rebuild dashboard views without updated_at, acc_number, acc_holder, amount'),
    ('20260313_006_drop_legacy_columns', 'Drop updated_at, acc_number, acc_holder, amount after compatibility rollout')
ON CONFLICT (version) DO NOTHING;
SQL

echo ">>> Aplicando roles y grants de aplicacion..."
psql_db \
    -v sync_user="$SYNC_DB_USER" \
    -v sync_password="$SYNC_DB_PASSWORD" \
    -v dashboard_user="$DASHBOARD_DB_USER" \
    -v dashboard_password="$DASHBOARD_DB_PASSWORD" \
    -f /sql/create_app_roles.sql

migration_version_for() {
    file_name="$1"
    case "$file_name" in
        000_schema_create.sql)
            echo ""
            ;;
        20260311_000_register_live_baseline.sql)
            echo "20260311_000_live_baseline"
            ;;
        *)
            echo "${file_name%.sql}"
            ;;
    esac
}

echo ">>> Aplicando migraciones pendientes..."
find /sql/migrations -maxdepth 1 -type f -name '*.sql' | sort | while read -r migration_file; do
    file_name="$(basename "$migration_file")"
    version="$(migration_version_for "$file_name")"

    if [ -z "$version" ]; then
        continue
    fi

    already_applied="$(psql_db -tAc "SELECT 1 FROM public.schema_migrations WHERE version = '$version' LIMIT 1" | tr -d '[:space:]')"
    if [ "$already_applied" = "1" ]; then
        echo "    - Saltando $file_name (ya registrada)"
        continue
    fi

    echo "    - Ejecutando $file_name"
    psql_db -f "$migration_file"
done

echo ">>> Reaplicando grants finales..."
psql_db \
    -v sync_user="$SYNC_DB_USER" \
    -v sync_password="$SYNC_DB_PASSWORD" \
    -v dashboard_user="$DASHBOARD_DB_USER" \
    -v dashboard_password="$DASHBOARD_DB_PASSWORD" \
    -f /sql/create_app_roles.sql

echo ">>> Bootstrap local completado."

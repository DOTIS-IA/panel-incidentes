BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'mas089_views_owner'
    ) THEN
        CREATE ROLE mas089_views_owner
            NOLOGIN
            NOSUPERUSER
            NOCREATEDB
            NOCREATEROLE
            NOREPLICATION;
    END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS analytics AUTHORIZATION mas089_views_owner;
ALTER SCHEMA analytics OWNER TO mas089_views_owner;

GRANT USAGE ON SCHEMA public TO mas089_views_owner;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mas089_views_owner;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT SELECT ON TABLES TO mas089_views_owner;

GRANT USAGE ON SCHEMA analytics TO mas089_dashboard_ro;

ALTER DEFAULT PRIVILEGES FOR ROLE mas089_views_owner IN SCHEMA analytics
    GRANT SELECT ON TABLES TO mas089_dashboard_ro;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version text PRIMARY KEY,
    description text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_migrations (version, description)
VALUES (
    '20260406_010_add_analytics_views_owner',
    'Create analytics schema and non-login owner role for delegated view creation'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;

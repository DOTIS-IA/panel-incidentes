BEGIN;

DO $$
DECLARE
    target_role text;
BEGIN
    FOR target_role IN
        SELECT DISTINCT grantee
        FROM information_schema.role_table_grants
        WHERE table_schema = 'public'
          AND table_name = 'vw_dashboard_base'
          AND privilege_type = 'SELECT'
    LOOP
        EXECUTE format(
            'GRANT SELECT ON TABLE public.extortion_type TO %I',
            target_role
        );
    END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version text PRIMARY KEY,
    description text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_migrations (version, description)
VALUES (
    '20260318_007_grant_dashboard_select_on_extortion_type',
    'Grant dashboard read access on extortion_type for database tab visibility'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;

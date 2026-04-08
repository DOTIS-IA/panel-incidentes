BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'procedente'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'is_actionable'
    ) THEN
        EXECUTE 'ALTER TABLE public.reports RENAME COLUMN procedente TO is_actionable';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vw_dashboard_base'
          AND column_name = 'procedente'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vw_dashboard_base'
          AND column_name = 'is_actionable'
    ) THEN
        EXECUTE 'ALTER VIEW public.vw_dashboard_base RENAME COLUMN procedente TO is_actionable';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vw_report_quality'
          AND column_name = 'procedente'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vw_report_quality'
          AND column_name = 'is_actionable'
    ) THEN
        EXECUTE 'ALTER VIEW public.vw_report_quality RENAME COLUMN procedente TO is_actionable';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vw_ops_last_20_conversations'
          AND column_name = 'procedente'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vw_ops_last_20_conversations'
          AND column_name = 'is_actionable'
    ) THEN
        EXECUTE 'ALTER VIEW public.vw_ops_last_20_conversations RENAME COLUMN procedente TO is_actionable';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version text PRIMARY KEY,
    description text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_migrations (version, description)
VALUES (
    '20260312_004_rename_procedente_to_is_actionable',
    'Rename procedente to is_actionable'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;

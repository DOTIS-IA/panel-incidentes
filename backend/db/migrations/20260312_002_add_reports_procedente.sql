BEGIN;

ALTER TABLE public.reports
    ADD COLUMN IF NOT EXISTS procedente boolean;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version text PRIMARY KEY,
    description text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_migrations (version, description)
VALUES (
    '20260312_002_add_reports_procedente',
    'Add procedente boolean flag to reports'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;

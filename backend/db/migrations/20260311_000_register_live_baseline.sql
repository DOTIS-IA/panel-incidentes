BEGIN;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version text PRIMARY KEY,
    description text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_migrations (version, description)
VALUES (
    '20260311_000_live_baseline',
    'Baseline captured from live bd_089 before remediation'
)
ON CONFLICT (version) DO NOTHING;

INSERT INTO public.schema_migrations (version, description)
SELECT
    '20260311_001_expand_reports_multivalue_fields',
    'Add multivalue report fields'
WHERE EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reports'
      AND column_name IN (
          'required_amount',
          'deposited_amount',
          'demand_type',
          'acc_numbers',
          'acc_holders'
      )
    GROUP BY table_name
    HAVING COUNT(*) = 5
)
ON CONFLICT (version) DO NOTHING;

INSERT INTO public.schema_migrations (version, description)
SELECT
    '20260312_002_add_reports_procedente',
    'Add procedente boolean flag to reports'
WHERE EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reports'
      AND column_name = 'procedente'
)
ON CONFLICT (version) DO NOTHING;

INSERT INTO public.schema_migrations (version, description)
SELECT
    '20260312_003_add_procedente_to_dashboard_views',
    'Expose procedente in dashboard views'
WHERE (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'procedente'
      AND table_name IN (
          'vw_dashboard_base',
          'vw_report_quality',
          'vw_ops_last_20_conversations'
      )
) = 3
ON CONFLICT (version) DO NOTHING;

INSERT INTO public.schema_migrations (version, description)
SELECT
    '20260312_004_rename_procedente_to_is_actionable',
    'Rename procedente to is_actionable'
WHERE EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reports'
      AND column_name = 'is_actionable'
)
AND (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'is_actionable'
      AND table_name IN (
          'vw_dashboard_base',
          'vw_report_quality',
          'vw_ops_last_20_conversations'
      )
) = 3
ON CONFLICT (version) DO NOTHING;

COMMIT;

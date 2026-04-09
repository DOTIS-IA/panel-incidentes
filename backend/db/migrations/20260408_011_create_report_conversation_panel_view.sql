BEGIN;

CREATE SCHEMA IF NOT EXISTS analytics;

DROP VIEW IF EXISTS analytics.vw_report_conversation_panel;

CREATE VIEW analytics.vw_report_conversation_panel AS
SELECT
    b.id_conv_eleven,
    b.id_agent,
    b.agent_name,
    b.id_extortion,
    b.extortion_name,
    b.event_ts,
    b.start_time,
    b.end_time,
    b.transcription,
    b.title,
    b.summary,
    b.call_duration_secs AS duration_secs,
    b.folio,
    b.report_date,
    b.mode,
    b.time_rep,
    b.place,
    b.phone,
    b.caller_role,
    b.contact_via,
    b.required_amount,
    b.deposited_amount,
    b.demand_type,
    b.acc_numbers,
    b.acc_holders,
    b.is_actionable
FROM public.vw_dashboard_base b
WHERE b.report_generated;

ALTER VIEW analytics.vw_report_conversation_panel OWNER TO mas089_views_owner;

GRANT SELECT ON TABLE analytics.vw_report_conversation_panel TO mas089_dashboard_ro;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version text PRIMARY KEY,
    description text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_migrations (version, description)
VALUES (
    '20260408_011_create_report_conversation_panel_view',
    'Create analytics.vw_report_conversation_panel for report dashboard queries'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;

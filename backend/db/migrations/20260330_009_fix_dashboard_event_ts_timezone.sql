BEGIN;

DROP VIEW IF EXISTS public.vw_ops_last_20_conversations;
DROP VIEW IF EXISTS public.vw_report_quality_daily;
DROP VIEW IF EXISTS public.vw_report_quality;
DROP VIEW IF EXISTS public.vw_temporal_performance_daily;
DROP VIEW IF EXISTS public.vw_ops_agent_quality_daily;
DROP VIEW IF EXISTS public.vw_dashboard_base;

CREATE VIEW public.vw_dashboard_base AS
WITH cost_by_conversation AS (
    SELECT
        id_conv_eleven,
        SUM(COALESCE(input_tokens, 0)) AS input_tokens,
        SUM(COALESCE(output_tokens, 0)) AS output_tokens,
        SUM(COALESCE(cache_read_tokens, 0)) AS cache_read_tokens,
        SUM(COALESCE(cache_write_tokens, 0)) AS cache_write_tokens,
        SUM(
            CASE
                WHEN llm_price_usd IS NOT NULL THEN llm_price_usd
                ELSE COALESCE(input_price_usd, 0)
                   + COALESCE(output_price_usd, 0)
                   + COALESCE(cache_read_price_usd, 0)
                   + COALESCE(cache_write_price_usd, 0)
            END
        ) AS total_cost_usd
    FROM public.conv_cost
    GROUP BY id_conv_eleven
)
SELECT
    cd.id_conv_eleven,
    cd.id_agent,
    a.name AS agent_name,
    cd.id_extortion,
    et.name AS extortion_name,
    cd.title,
    cd.summary,
    cd.eval_criteria,
    cd.status_conv,
    COALESCE(cd.call_successful, 'unknown') AS call_successful,
    COALESCE(
        cd.call_duration_secs,
        CASE
            WHEN ce.start_time IS NOT NULL AND ce.end_time IS NOT NULL
                THEN EXTRACT(EPOCH FROM (ce.end_time - ce.start_time))::int
            ELSE NULL
        END
    ) AS call_duration_secs,
    cd.termination_reason,
    cd.metadata_raw,
    cd.created_at,
    ce.date_exec,
    ce.start_time,
    ce.end_time,
    ce.transcription,
    COALESCE(
        timezone('America/Mexico_City', to_timestamp(cd.start_time_unix_secs)),
        ce.start_time,
        cd.created_at
    ) AS event_ts,
    r.folio,
    (r.id_conv_eleven IS NOT NULL) AS report_generated,
    r.report_date,
    r.mode,
    r.time_rep,
    r.place,
    r.phone,
    r.caller_role,
    r.contact_via,
    COALESCE(cb.input_tokens, 0) AS input_tokens,
    COALESCE(cb.output_tokens, 0) AS output_tokens,
    COALESCE(cb.cache_read_tokens, 0) AS cache_read_tokens,
    COALESCE(cb.cache_write_tokens, 0) AS cache_write_tokens,
    COALESCE(cb.total_cost_usd, 0) AS total_cost_usd,
    r.required_amount,
    r.deposited_amount,
    r.demand_type,
    r.acc_numbers,
    r.acc_holders,
    r.is_actionable
FROM public.conv_details cd
LEFT JOIN public.agents a
    ON a.id_agent = cd.id_agent
LEFT JOIN public.extortion_type et
    ON et.id_extortion = cd.id_extortion
LEFT JOIN public.conv_exec ce
    ON ce.id_conv_eleven = cd.id_conv_eleven
LEFT JOIN public.reports r
    ON r.id_conv_eleven = cd.id_conv_eleven
LEFT JOIN cost_by_conversation cb
    ON cb.id_conv_eleven = cd.id_conv_eleven;

CREATE VIEW public.vw_ops_agent_quality_daily AS
SELECT
    event_ts::date AS event_date,
    id_agent,
    agent_name,
    COUNT(*) AS total_conversations,
    COUNT(*) FILTER (WHERE status_conv = 'done') AS done_conversations,
    COUNT(*) FILTER (WHERE status_conv = 'failed') AS failed_conversations,
    COUNT(*) FILTER (WHERE call_successful = 'success') AS success_calls,
    COUNT(*) FILTER (WHERE call_successful = 'failure') AS failure_calls,
    COUNT(*) FILTER (WHERE call_successful = 'unknown') AS unknown_calls,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE call_successful = 'success')
        / NULLIF(COUNT(*), 0),
        2
    ) AS success_rate_pct,
    ROUND(
        AVG(call_duration_secs) FILTER (WHERE status_conv = 'done'),
        2
    ) AS avg_duration_done_secs,
    ROUND(
        AVG(call_duration_secs) FILTER (WHERE status_conv = 'failed'),
        2
    ) AS avg_duration_failed_secs,
    COUNT(*) FILTER (WHERE report_generated) AS reports_generated,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE report_generated)
        / NULLIF(COUNT(*), 0),
        2
    ) AS conversion_rate_pct
FROM public.vw_dashboard_base
GROUP BY event_ts::date, id_agent, agent_name;

CREATE VIEW public.vw_temporal_performance_daily AS
SELECT
    event_ts::date AS event_date,
    COUNT(*) AS total_conversations,
    COUNT(*) FILTER (WHERE call_successful = 'success') AS success_calls,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE call_successful = 'success')
        / NULLIF(COUNT(*), 0),
        2
    ) AS success_rate_pct,
    ROUND(AVG(call_duration_secs), 2) AS avg_call_duration_secs,
    COUNT(*) FILTER (WHERE report_generated) AS reports_generated,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE report_generated)
        / NULLIF(COUNT(*), 0),
        2
    ) AS report_generation_rate_pct
FROM public.vw_dashboard_base
GROUP BY event_ts::date;

CREATE VIEW public.vw_report_quality AS
WITH base AS (
    SELECT
        id_conv_eleven,
        event_ts,
        call_duration_secs,
        report_generated,
        report_date,
        folio,
        mode,
        place,
        time_rep,
        phone,
        caller_role,
        contact_via,
        required_amount,
        deposited_amount,
        demand_type,
        acc_numbers,
        acc_holders,
        is_actionable
    FROM public.vw_dashboard_base
    WHERE report_generated
),
flags AS (
    SELECT
        *,
        (NULLIF(trim(COALESCE(mode, '')), '') IS NOT NULL) AS mode_ok,
        (NULLIF(trim(COALESCE(place, '')), '') IS NOT NULL) AS place_ok,
        (NULLIF(trim(COALESCE(time_rep, '')), '') IS NOT NULL) AS time_ok,
        (NULLIF(trim(COALESCE(phone, '')), '') IS NOT NULL) AS phone_present,
        (COALESCE(cardinality(acc_numbers), 0) > 0) AS acc_present,
        (COALESCE(cardinality(acc_holders), 0) > 0) AS acc_holder_ok,
        (NULLIF(trim(COALESCE(caller_role, '')), '') IS NOT NULL) AS caller_role_ok,
        (NULLIF(trim(COALESCE(contact_via, '')), '') IS NOT NULL) AS contact_via_ok,
        (NULLIF(trim(COALESCE(demand_type, '')), '') IS NOT NULL) AS demand_type_ok,
        (COALESCE(cardinality(required_amount), 0) > 0) AS required_amount_present,
        (COALESCE(cardinality(deposited_amount), 0) > 0) AS deposited_amount_present,
        (COALESCE(cardinality(acc_numbers), 0) = COALESCE(cardinality(acc_holders), 0)) AS acc_pairs_match
    FROM base
)
SELECT
    id_conv_eleven,
    folio,
    event_ts::date AS event_date,
    report_date,
    call_duration_secs,
    mode,
    place,
    time_rep,
    phone,
    caller_role,
    contact_via,
    CASE
        WHEN mode_ok AND place_ok AND time_ok AND phone_present AND acc_present
             AND acc_holder_ok AND caller_role_ok AND contact_via_ok THEN 100
        WHEN mode_ok AND place_ok AND time_ok AND phone_present AND acc_present THEN 75
        WHEN mode_ok AND place_ok AND time_ok THEN 50
        ELSE 25
    END AS completeness_score,
    ARRAY_REMOVE(ARRAY[
        CASE WHEN NOT mode_ok THEN 'mode' END,
        CASE WHEN NOT place_ok THEN 'place' END,
        CASE WHEN NOT time_ok THEN 'time_rep' END,
        CASE WHEN NOT phone_present THEN 'phone' END,
        CASE WHEN NOT acc_present THEN 'acc_numbers' END,
        CASE WHEN NOT acc_holder_ok THEN 'acc_holders' END,
        CASE WHEN NOT caller_role_ok THEN 'caller_role' END,
        CASE WHEN NOT contact_via_ok THEN 'contact_via' END
    ], NULL) AS missing_fields,
    (phone ~ '^[0-9]{10,15}$') AS phone_valid_format,
    CASE
        WHEN COALESCE(cardinality(acc_numbers), 0) > 0 THEN NOT EXISTS (
            SELECT 1
            FROM unnest(acc_numbers) AS u(acc_value)
            WHERE u.acc_value IS NULL
               OR btrim(u.acc_value) = ''
               OR u.acc_value !~ '^[0-9]{18}$'
        )
        ELSE FALSE
    END AS acc_number_valid_format,
    (lower(trim(COALESCE(place, ''))) IN ('desconocido', 'unknown', 'n/a', 'na', '-', 'sin dato')) AS place_is_unknown,
    required_amount,
    deposited_amount,
    demand_type,
    acc_numbers,
    acc_holders,
    demand_type_ok,
    required_amount_present,
    deposited_amount_present,
    acc_pairs_match,
    is_actionable
FROM flags;

CREATE VIEW public.vw_report_quality_daily AS
SELECT
    event_date,
    COUNT(*) AS total_reports,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE completeness_score = 100)
        / NULLIF(COUNT(*), 0),
        2
    ) AS pct_full_reports,
    ROUND(AVG(completeness_score), 2) AS avg_completeness_score,
    ROUND(AVG(call_duration_secs), 2) AS avg_call_duration_secs,
    COUNT(*) FILTER (WHERE place_is_unknown) AS unknown_place_reports
FROM public.vw_report_quality
GROUP BY event_date;

CREATE VIEW public.vw_ops_last_20_conversations AS
SELECT
    b.event_ts,
    b.id_conv_eleven,
    b.id_agent,
    b.agent_name,
    b.status_conv,
    b.call_successful,
    b.call_duration_secs,
    b.report_generated,
    b.folio,
    rq.completeness_score,
    rq.missing_fields,
    b.transcription,
    rq.is_actionable
FROM public.vw_dashboard_base b
LEFT JOIN public.vw_report_quality rq
    ON rq.id_conv_eleven = b.id_conv_eleven
ORDER BY b.event_ts DESC NULLS LAST
LIMIT 20;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'mas089_dashboard_ro'
    ) THEN
        EXECUTE '
            GRANT SELECT ON TABLE
                public.vw_dashboard_base,
                public.vw_ops_agent_quality_daily,
                public.vw_ops_last_20_conversations,
                public.vw_report_quality,
                public.vw_report_quality_daily,
                public.vw_temporal_performance_daily
            TO mas089_dashboard_ro
        ';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version text PRIMARY KEY,
    description text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_migrations (version, description)
VALUES (
    '20260330_009_fix_dashboard_event_ts_timezone',
    'Rebuild dashboard views to convert event_ts to America/Mexico_City'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;

BEGIN;

CREATE OR REPLACE VIEW public.vw_dashboard_base AS
 WITH cost_by_conversation AS (
         SELECT conv_cost.id_conv_eleven,
            sum(COALESCE(conv_cost.input_tokens, (0)::bigint)) AS input_tokens,
            sum(COALESCE(conv_cost.output_tokens, (0)::bigint)) AS output_tokens,
            sum(COALESCE(conv_cost.cache_read_tokens, (0)::bigint)) AS cache_read_tokens,
            sum(COALESCE(conv_cost.cache_write_tokens, (0)::bigint)) AS cache_write_tokens,
            sum(
                CASE
                    WHEN (conv_cost.llm_price_usd IS NOT NULL) THEN conv_cost.llm_price_usd
                    ELSE (((COALESCE(conv_cost.input_price_usd, (0)::numeric) + COALESCE(conv_cost.output_price_usd, (0)::numeric)) + COALESCE(conv_cost.cache_read_price_usd, (0)::numeric)) + COALESCE(conv_cost.cache_write_price_usd, (0)::numeric))
                END) AS total_cost_usd
           FROM public.conv_cost
          GROUP BY conv_cost.id_conv_eleven
        )
 SELECT cd.id_conv_eleven,
    cd.id_agent,
    a.name AS agent_name,
    cd.id_extortion,
    et.name AS extortion_name,
    cd.title,
    cd.summary,
    cd.eval_criteria,
    cd.status_conv,
    COALESCE(cd.call_successful, 'unknown'::character varying) AS call_successful,
    COALESCE(cd.call_duration_secs,
        CASE
            WHEN ((ce.start_time IS NOT NULL) AND (ce.end_time IS NOT NULL)) THEN (EXTRACT(epoch FROM (ce.end_time - ce.start_time)))::integer
            ELSE NULL::integer
        END) AS call_duration_secs,
    cd.termination_reason,
    cd.metadata_raw,
    cd.created_at,
    cd.updated_at,
    ce.date_exec,
    ce.start_time,
    ce.end_time,
    ce.transcription,
    COALESCE((ce.start_time)::timestamp with time zone, to_timestamp((cd.start_time_unix_secs)::double precision), (cd.created_at)::timestamp with time zone) AS event_ts,
    r.folio,
    (r.id_conv_eleven IS NOT NULL) AS report_generated,
    r.report_date,
    r.mode,
    r.time_rep,
    r.place,
    r.phone,
    r.acc_number,
    r.acc_holder,
    r.caller_role,
    r.amount,
    r.contact_via,
    COALESCE(cb.input_tokens, (0)::numeric) AS input_tokens,
    COALESCE(cb.output_tokens, (0)::numeric) AS output_tokens,
    COALESCE(cb.cache_read_tokens, (0)::numeric) AS cache_read_tokens,
    COALESCE(cb.cache_write_tokens, (0)::numeric) AS cache_write_tokens,
    COALESCE(cb.total_cost_usd, (0)::numeric) AS total_cost_usd,
    r.required_amount,
    r.deposited_amount,
    r.demand_type,
    COALESCE(r.acc_numbers,
        CASE
            WHEN ((r.acc_number IS NOT NULL) AND (btrim((r.acc_number)::text) <> ''::text)) THEN ARRAY[(r.acc_number)::text]
            ELSE NULL::text[]
        END) AS acc_numbers,
    COALESCE(r.acc_holders,
        CASE
            WHEN ((r.acc_holder IS NOT NULL) AND (btrim((r.acc_holder)::text) <> ''::text)) THEN ARRAY[(r.acc_holder)::text]
            ELSE NULL::text[]
        END) AS acc_holders,
    r.procedente
   FROM (((((public.conv_details cd
     LEFT JOIN public.agents a ON (((a.id_agent)::text = (cd.id_agent)::text)))
     LEFT JOIN public.extortion_type et ON ((et.id_extortion = cd.id_extortion)))
     LEFT JOIN public.conv_exec ce ON (((ce.id_conv_eleven)::text = (cd.id_conv_eleven)::text)))
     LEFT JOIN public.reports r ON (((r.id_conv_eleven)::text = (cd.id_conv_eleven)::text)))
     LEFT JOIN cost_by_conversation cb ON (((cb.id_conv_eleven)::text = (cd.id_conv_eleven)::text)));

CREATE OR REPLACE VIEW public.vw_report_quality AS
 WITH base AS (
         SELECT vw_dashboard_base.id_conv_eleven,
            vw_dashboard_base.event_ts,
            vw_dashboard_base.call_duration_secs,
            vw_dashboard_base.report_generated,
            vw_dashboard_base.report_date,
            vw_dashboard_base.folio,
            vw_dashboard_base.mode,
            vw_dashboard_base.place,
            vw_dashboard_base.time_rep,
            vw_dashboard_base.phone,
            vw_dashboard_base.acc_number,
            vw_dashboard_base.acc_holder,
            vw_dashboard_base.caller_role,
            vw_dashboard_base.contact_via,
            vw_dashboard_base.required_amount,
            vw_dashboard_base.deposited_amount,
            vw_dashboard_base.demand_type,
            vw_dashboard_base.acc_numbers,
            vw_dashboard_base.acc_holders,
            vw_dashboard_base.procedente
           FROM public.vw_dashboard_base
          WHERE vw_dashboard_base.report_generated
        ), flags AS (
         SELECT base.id_conv_eleven,
            base.event_ts,
            base.call_duration_secs,
            base.report_generated,
            base.report_date,
            base.folio,
            base.mode,
            base.place,
            base.time_rep,
            base.phone,
            base.acc_number,
            base.acc_holder,
            base.caller_role,
            base.contact_via,
            base.required_amount,
            base.deposited_amount,
            base.demand_type,
            base.acc_numbers,
            base.acc_holders,
            base.procedente,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.mode, ''::text)), ''::text) IS NOT NULL) AS mode_ok,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.place, ''::text)), ''::text) IS NOT NULL) AS place_ok,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.time_rep, ''::text)), ''::text) IS NOT NULL) AS time_ok,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.phone, ''::character varying)), ''::text) IS NOT NULL) AS phone_present,
            ((COALESCE(cardinality(base.acc_numbers), 0) > 0) OR (NULLIF(TRIM(BOTH FROM COALESCE(base.acc_number, ''::character varying)), ''::text) IS NOT NULL)) AS acc_present,
            ((COALESCE(cardinality(base.acc_holders), 0) > 0) OR (NULLIF(TRIM(BOTH FROM COALESCE(base.acc_holder, ''::character varying)), ''::text) IS NOT NULL)) AS acc_holder_ok,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.caller_role, ''::character varying)), ''::text) IS NOT NULL) AS caller_role_ok,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.contact_via, ''::character varying)), ''::text) IS NOT NULL) AS contact_via_ok,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.demand_type, ''::text)), ''::text) IS NOT NULL) AS demand_type_ok,
            (COALESCE(cardinality(base.required_amount), 0) > 0) AS required_amount_present,
            (COALESCE(cardinality(base.deposited_amount), 0) > 0) AS deposited_amount_present,
            (((COALESCE(cardinality(base.acc_numbers), 0) = 0) AND (COALESCE(cardinality(base.acc_holders), 0) = 0)) OR (cardinality(base.acc_numbers) = cardinality(base.acc_holders))) AS acc_pairs_match
           FROM base
        )
 SELECT id_conv_eleven,
    folio,
    (event_ts)::date AS event_date,
    report_date,
    call_duration_secs,
    mode,
    place,
    time_rep,
    phone,
    acc_number,
    acc_holder,
    caller_role,
    contact_via,
        CASE
            WHEN (mode_ok AND place_ok AND time_ok AND phone_present AND acc_present AND acc_holder_ok AND caller_role_ok AND contact_via_ok) THEN 100
            WHEN (mode_ok AND place_ok AND time_ok AND phone_present AND acc_present) THEN 75
            WHEN (mode_ok AND place_ok AND time_ok) THEN 50
            ELSE 25
        END AS completeness_score,
    array_remove(ARRAY[
        CASE
            WHEN (NOT mode_ok) THEN 'mode'::text
            ELSE NULL::text
        END,
        CASE
            WHEN (NOT place_ok) THEN 'place'::text
            ELSE NULL::text
        END,
        CASE
            WHEN (NOT time_ok) THEN 'time_rep'::text
            ELSE NULL::text
        END,
        CASE
            WHEN (NOT phone_present) THEN 'phone'::text
            ELSE NULL::text
        END,
        CASE
            WHEN (NOT acc_present) THEN 'acc_number'::text
            ELSE NULL::text
        END,
        CASE
            WHEN (NOT acc_holder_ok) THEN 'acc_holder'::text
            ELSE NULL::text
        END,
        CASE
            WHEN (NOT caller_role_ok) THEN 'caller_role'::text
            ELSE NULL::text
        END,
        CASE
            WHEN (NOT contact_via_ok) THEN 'contact_via'::text
            ELSE NULL::text
        END], NULL::text) AS missing_fields,
    ((phone)::text ~ '^[0-9]{10,15}$'::text) AS phone_valid_format,
        CASE
            WHEN (COALESCE(cardinality(acc_numbers), 0) > 0) THEN (NOT (EXISTS ( SELECT 1
               FROM unnest(flags.acc_numbers) u(acc_value)
              WHERE ((u.acc_value IS NULL) OR (btrim(u.acc_value) = ''::text) OR (u.acc_value !~ '^[0-9]{18}$'::text)))))
            ELSE ((acc_number)::text ~ '^[A-Za-z0-9]{8,50}$'::text)
        END AS acc_number_valid_format,
    (lower(TRIM(BOTH FROM COALESCE(place, ''::text))) = ANY (ARRAY['desconocido'::text, 'unknown'::text, 'n/a'::text, 'na'::text, '-'::text, 'sin dato'::text])) AS place_is_unknown,
    required_amount,
    deposited_amount,
    demand_type,
    acc_numbers,
    acc_holders,
    demand_type_ok,
    required_amount_present,
    deposited_amount_present,
    acc_pairs_match,
    procedente
   FROM flags;

CREATE OR REPLACE VIEW public.vw_ops_last_20_conversations AS
 SELECT b.event_ts,
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
    rq.procedente
   FROM (public.vw_dashboard_base b
     LEFT JOIN public.vw_report_quality rq ON (((rq.id_conv_eleven)::text = (b.id_conv_eleven)::text)))
  ORDER BY b.event_ts DESC NULLS LAST
 LIMIT 20;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version text PRIMARY KEY,
    description text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_migrations (version, description)
VALUES (
    '20260312_003_add_procedente_to_dashboard_views',
    'Expose procedente in dashboard views'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;

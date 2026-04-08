--
-- PostgreSQL database dump
--

\restrict JiWf4datMndvraafPiJ7k0BYqVPxZhvihRhfX2jee174eFTxdcicn8fwPM0CBIV

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agents (
    id_agent character varying(34) NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    id_version character varying(36),
    id_branch character varying(36)
);


--
-- Name: conv_cost; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conv_cost (
    id_cost integer NOT NULL,
    id_conv_eleven character varying(33) NOT NULL,
    source character varying(50) NOT NULL,
    model_name character varying(100) NOT NULL,
    input_tokens bigint,
    output_tokens bigint,
    cache_read_tokens bigint,
    cache_write_tokens bigint,
    input_price_usd numeric(10,6),
    output_price_usd numeric(10,6),
    cache_read_price_usd numeric(10,6),
    cache_write_price_usd numeric(10,6),
    total_cost_units integer,
    llm_price_usd numeric(10,6),
    llm_charge_unit integer,
    call_charge_units integer,
    CONSTRAINT check_prices_positive CHECK ((((input_price_usd IS NULL) OR (input_price_usd >= (0)::numeric)) AND ((output_price_usd IS NULL) OR (output_price_usd >= (0)::numeric)) AND ((cache_read_price_usd IS NULL) OR (cache_read_price_usd >= (0)::numeric)) AND ((cache_write_price_usd IS NULL) OR (cache_write_price_usd >= (0)::numeric)) AND ((llm_price_usd IS NULL) OR (llm_price_usd >= (0)::numeric)))),
    CONSTRAINT check_tokens_positive CHECK ((((input_tokens IS NULL) OR (input_tokens >= 0)) AND ((output_tokens IS NULL) OR (output_tokens >= 0)) AND ((cache_read_tokens IS NULL) OR (cache_read_tokens >= 0)) AND ((cache_write_tokens IS NULL) OR (cache_write_tokens >= 0))))
);


--
-- Name: conv_cost_id_cost_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conv_cost_id_cost_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conv_cost_id_cost_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conv_cost_id_cost_seq OWNED BY public.conv_cost.id_cost;


--
-- Name: conv_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conv_details (
    id_conv_det bigint NOT NULL,
    id_conv_eleven character varying(33) NOT NULL,
    id_agent character varying(34) NOT NULL,
    id_extortion integer,
    title text,
    summary text,
    eval_criteria jsonb,
    status_conv character varying(15) NOT NULL,
    start_time_unix_secs bigint,
    accepted_time_unix_secs bigint,
    call_duration_secs integer,
    termination_reason text,
    call_successful character varying(10),
    metadata_raw jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_call_duration_positive CHECK (((call_duration_secs IS NULL) OR (call_duration_secs >= 0))),
    CONSTRAINT check_call_successful_valid CHECK (((call_successful)::text = ANY (ARRAY[('success'::character varying)::text, ('failure'::character varying)::text, ('unknown'::character varying)::text]))),
    CONSTRAINT check_status_is_valid CHECK (((status_conv)::text = ANY (ARRAY[('done'::character varying)::text, ('failed'::character varying)::text, ('processing'::character varying)::text, ('in-progress'::character varying)::text, ('initiated'::character varying)::text])))
);


--
-- Name: conv_details_id_conv_det_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conv_details_id_conv_det_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conv_details_id_conv_det_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conv_details_id_conv_det_seq OWNED BY public.conv_details.id_conv_det;


--
-- Name: conv_exec; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conv_exec (
    id_conv integer NOT NULL,
    id_conv_eleven character varying(33) NOT NULL,
    id_agent character varying(34),
    date_exec date NOT NULL,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    transcription jsonb NOT NULL,
    CONSTRAINT check_exec_times_order CHECK (((end_time IS NULL) OR (start_time IS NULL) OR (end_time >= start_time)))
);


--
-- Name: conv_exec_id_conv_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conv_exec_id_conv_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conv_exec_id_conv_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conv_exec_id_conv_seq OWNED BY public.conv_exec.id_conv;


--
-- Name: extortion_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extortion_type (
    id_extortion integer NOT NULL,
    name character varying(100) NOT NULL,
    description text NOT NULL
);


--
-- Name: extortion_type_id_extortion_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.extortion_type_id_extortion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: extortion_type_id_extortion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.extortion_type_id_extortion_seq OWNED BY public.extortion_type.id_extortion;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    folio character varying(9) NOT NULL,
    id_conv_eleven character varying(33) NOT NULL,
    mode text,
    time_rep text,
    place text,
    report_date date NOT NULL,
    phone character varying(20),
    caller_role character varying(100),
    contact_via character varying(50),
    required_amount numeric(12,2)[],
    deposited_amount numeric(12,2)[],
    demand_type text,
    acc_numbers text[],
    acc_holders text[],
    is_actionable boolean
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version text NOT NULL,
    description text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vw_dashboard_base; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_dashboard_base AS
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
    r.caller_role,
    r.contact_via,
    COALESCE(cb.input_tokens, (0)::numeric) AS input_tokens,
    COALESCE(cb.output_tokens, (0)::numeric) AS output_tokens,
    COALESCE(cb.cache_read_tokens, (0)::numeric) AS cache_read_tokens,
    COALESCE(cb.cache_write_tokens, (0)::numeric) AS cache_write_tokens,
    COALESCE(cb.total_cost_usd, (0)::numeric) AS total_cost_usd,
    r.required_amount,
    r.deposited_amount,
    r.demand_type,
    r.acc_numbers,
    r.acc_holders,
    r.is_actionable
   FROM (((((public.conv_details cd
     LEFT JOIN public.agents a ON (((a.id_agent)::text = (cd.id_agent)::text)))
     LEFT JOIN public.extortion_type et ON ((et.id_extortion = cd.id_extortion)))
     LEFT JOIN public.conv_exec ce ON (((ce.id_conv_eleven)::text = (cd.id_conv_eleven)::text)))
     LEFT JOIN public.reports r ON (((r.id_conv_eleven)::text = (cd.id_conv_eleven)::text)))
     LEFT JOIN cost_by_conversation cb ON (((cb.id_conv_eleven)::text = (cd.id_conv_eleven)::text)));


--
-- Name: vw_ops_agent_quality_daily; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_ops_agent_quality_daily AS
 SELECT (event_ts)::date AS event_date,
    id_agent,
    agent_name,
    count(*) AS total_conversations,
    count(*) FILTER (WHERE ((status_conv)::text = 'done'::text)) AS done_conversations,
    count(*) FILTER (WHERE ((status_conv)::text = 'failed'::text)) AS failed_conversations,
    count(*) FILTER (WHERE ((call_successful)::text = 'success'::text)) AS success_calls,
    count(*) FILTER (WHERE ((call_successful)::text = 'failure'::text)) AS failure_calls,
    count(*) FILTER (WHERE ((call_successful)::text = 'unknown'::text)) AS unknown_calls,
    round(((100.0 * (count(*) FILTER (WHERE ((call_successful)::text = 'success'::text)))::numeric) / (NULLIF(count(*), 0))::numeric), 2) AS success_rate_pct,
    round(avg(call_duration_secs) FILTER (WHERE ((status_conv)::text = 'done'::text)), 2) AS avg_duration_done_secs,
    round(avg(call_duration_secs) FILTER (WHERE ((status_conv)::text = 'failed'::text)), 2) AS avg_duration_failed_secs,
    count(*) FILTER (WHERE report_generated) AS reports_generated,
    round(((100.0 * (count(*) FILTER (WHERE report_generated))::numeric) / (NULLIF(count(*), 0))::numeric), 2) AS conversion_rate_pct
   FROM public.vw_dashboard_base
  GROUP BY ((event_ts)::date), id_agent, agent_name;


--
-- Name: vw_report_quality; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_report_quality AS
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
            vw_dashboard_base.caller_role,
            vw_dashboard_base.contact_via,
            vw_dashboard_base.required_amount,
            vw_dashboard_base.deposited_amount,
            vw_dashboard_base.demand_type,
            vw_dashboard_base.acc_numbers,
            vw_dashboard_base.acc_holders,
            vw_dashboard_base.is_actionable
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
            base.caller_role,
            base.contact_via,
            base.required_amount,
            base.deposited_amount,
            base.demand_type,
            base.acc_numbers,
            base.acc_holders,
            base.is_actionable,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.mode, ''::text)), ''::text) IS NOT NULL) AS mode_ok,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.place, ''::text)), ''::text) IS NOT NULL) AS place_ok,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.time_rep, ''::text)), ''::text) IS NOT NULL) AS time_ok,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.phone, ''::character varying)), ''::text) IS NOT NULL) AS phone_present,
            (COALESCE(cardinality(base.acc_numbers), 0) > 0) AS acc_present,
            (COALESCE(cardinality(base.acc_holders), 0) > 0) AS acc_holder_ok,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.caller_role, ''::character varying)), ''::text) IS NOT NULL) AS caller_role_ok,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.contact_via, ''::character varying)), ''::text) IS NOT NULL) AS contact_via_ok,
            (NULLIF(TRIM(BOTH FROM COALESCE(base.demand_type, ''::text)), ''::text) IS NOT NULL) AS demand_type_ok,
            (COALESCE(cardinality(base.required_amount), 0) > 0) AS required_amount_present,
            (COALESCE(cardinality(base.deposited_amount), 0) > 0) AS deposited_amount_present,
            (COALESCE(cardinality(base.acc_numbers), 0) = COALESCE(cardinality(base.acc_holders), 0)) AS acc_pairs_match
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
            WHEN (NOT acc_present) THEN 'acc_numbers'::text
            ELSE NULL::text
        END,
        CASE
            WHEN (NOT acc_holder_ok) THEN 'acc_holders'::text
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
            ELSE false
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
    is_actionable
   FROM flags;


--
-- Name: vw_ops_last_20_conversations; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_ops_last_20_conversations AS
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
    rq.is_actionable
   FROM (public.vw_dashboard_base b
     LEFT JOIN public.vw_report_quality rq ON (((rq.id_conv_eleven)::text = (b.id_conv_eleven)::text)))
  ORDER BY b.event_ts DESC NULLS LAST
 LIMIT 20;


--
-- Name: vw_report_quality_daily; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_report_quality_daily AS
 SELECT event_date,
    count(*) AS total_reports,
    round(((100.0 * (count(*) FILTER (WHERE (completeness_score = 100)))::numeric) / (NULLIF(count(*), 0))::numeric), 2) AS pct_full_reports,
    round(avg(completeness_score), 2) AS avg_completeness_score,
    round(avg(call_duration_secs), 2) AS avg_call_duration_secs,
    count(*) FILTER (WHERE place_is_unknown) AS unknown_place_reports
   FROM public.vw_report_quality
  GROUP BY event_date;


--
-- Name: vw_temporal_performance_daily; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_temporal_performance_daily AS
 SELECT (event_ts)::date AS event_date,
    count(*) AS total_conversations,
    count(*) FILTER (WHERE ((call_successful)::text = 'success'::text)) AS success_calls,
    round(((100.0 * (count(*) FILTER (WHERE ((call_successful)::text = 'success'::text)))::numeric) / (NULLIF(count(*), 0))::numeric), 2) AS success_rate_pct,
    round(avg(call_duration_secs), 2) AS avg_call_duration_secs,
    count(*) FILTER (WHERE report_generated) AS reports_generated,
    round(((100.0 * (count(*) FILTER (WHERE report_generated))::numeric) / (NULLIF(count(*), 0))::numeric), 2) AS report_generation_rate_pct
   FROM public.vw_dashboard_base
  GROUP BY ((event_ts)::date);


--
-- Name: conv_cost id_cost; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conv_cost ALTER COLUMN id_cost SET DEFAULT nextval('public.conv_cost_id_cost_seq'::regclass);


--
-- Name: conv_details id_conv_det; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conv_details ALTER COLUMN id_conv_det SET DEFAULT nextval('public.conv_details_id_conv_det_seq'::regclass);


--
-- Name: conv_exec id_conv; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conv_exec ALTER COLUMN id_conv SET DEFAULT nextval('public.conv_exec_id_conv_seq'::regclass);


--
-- Name: extortion_type id_extortion; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extortion_type ALTER COLUMN id_extortion SET DEFAULT nextval('public.extortion_type_id_extortion_seq'::regclass);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id_agent);


--
-- Name: conv_cost conv_cost_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conv_cost
    ADD CONSTRAINT conv_cost_pkey PRIMARY KEY (id_cost);


--
-- Name: conv_details conv_details_id_conv_eleven_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conv_details
    ADD CONSTRAINT conv_details_id_conv_eleven_key UNIQUE (id_conv_eleven);


--
-- Name: conv_details conv_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conv_details
    ADD CONSTRAINT conv_details_pkey PRIMARY KEY (id_conv_det);


--
-- Name: conv_exec conv_exec_id_conv_eleven_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conv_exec
    ADD CONSTRAINT conv_exec_id_conv_eleven_key UNIQUE (id_conv_eleven);


--
-- Name: conv_exec conv_exec_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conv_exec
    ADD CONSTRAINT conv_exec_pkey PRIMARY KEY (id_conv);


--
-- Name: extortion_type extortion_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extortion_type
    ADD CONSTRAINT extortion_type_pkey PRIMARY KEY (id_extortion);


--
-- Name: reports reports_id_conv_eleven_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_id_conv_eleven_key UNIQUE (id_conv_eleven);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (folio);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: idx_conv_cost_id_eleven; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conv_cost_id_eleven ON public.conv_cost USING btree (id_conv_eleven);


--
-- Name: idx_conv_cost_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conv_cost_model ON public.conv_cost USING btree (model_name);


--
-- Name: idx_conv_details_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conv_details_agent ON public.conv_details USING btree (id_agent);


--
-- Name: idx_conv_details_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conv_details_created_at ON public.conv_details USING btree (created_at);


--
-- Name: idx_conv_details_id_eleven; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conv_details_id_eleven ON public.conv_details USING btree (id_conv_eleven);


--
-- Name: idx_conv_details_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conv_details_status ON public.conv_details USING btree (status_conv);


--
-- Name: idx_conv_exec_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conv_exec_date ON public.conv_exec USING btree (date_exec);


--
-- Name: idx_conv_exec_id_eleven; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conv_exec_id_eleven ON public.conv_exec USING btree (id_conv_eleven);


--
-- Name: idx_reports_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_date ON public.reports USING btree (report_date);


--
-- Name: idx_reports_id_eleven; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_id_eleven ON public.reports USING btree (id_conv_eleven);


--
-- Name: conv_cost fk_conv_cost_conv_details; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conv_cost
    ADD CONSTRAINT fk_conv_cost_conv_details FOREIGN KEY (id_conv_eleven) REFERENCES public.conv_details(id_conv_eleven);


--
-- Name: conv_details fk_conv_details_agent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conv_details
    ADD CONSTRAINT fk_conv_details_agent FOREIGN KEY (id_agent) REFERENCES public.agents(id_agent);


--
-- Name: conv_details fk_conv_details_extortion; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conv_details
    ADD CONSTRAINT fk_conv_details_extortion FOREIGN KEY (id_extortion) REFERENCES public.extortion_type(id_extortion);


--
-- Name: conv_exec fk_conv_exec_conv_details; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conv_exec
    ADD CONSTRAINT fk_conv_exec_conv_details FOREIGN KEY (id_conv_eleven) REFERENCES public.conv_details(id_conv_eleven);


--
-- Name: reports fk_reports_conv_details; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT fk_reports_conv_details FOREIGN KEY (id_conv_eleven) REFERENCES public.conv_details(id_conv_eleven);


--
-- PostgreSQL database dump complete
--

\unrestrict JiWf4datMndvraafPiJ7k0BYqVPxZhvihRhfX2jee174eFTxdcicn8fwPM0CBIV


\set ON_ERROR_STOP on

SELECT format(
    'CREATE ROLE %I LOGIN PASSWORD %L',
    :'sync_user',
    :'sync_password'
)
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = :'sync_user'
)
\gexec

SELECT format(
    'ALTER ROLE %I LOGIN PASSWORD %L',
    :'sync_user',
    :'sync_password'
)
\gexec

SELECT format(
    'CREATE ROLE %I LOGIN PASSWORD %L',
    :'dashboard_user',
    :'dashboard_password'
)
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = :'dashboard_user'
)
\gexec

SELECT format(
    'ALTER ROLE %I LOGIN PASSWORD %L',
    :'dashboard_user',
    :'dashboard_password'
)
\gexec

GRANT CONNECT ON DATABASE bd_089 TO :"sync_user";
GRANT CONNECT ON DATABASE bd_089 TO :"dashboard_user";

\connect bd_089

GRANT USAGE ON SCHEMA public TO :"sync_user";
GRANT USAGE ON SCHEMA public TO :"dashboard_user";

GRANT SELECT, INSERT, UPDATE ON TABLE
    public.agents,
    public.conv_details,
    public.conv_exec,
    public.reports,
    public.extortion_type
TO :"sync_user";

GRANT USAGE, SELECT, UPDATE ON SEQUENCE
    public.conv_details_id_conv_det_seq,
    public.conv_exec_id_conv_seq
TO :"sync_user";

GRANT SELECT ON TABLE
    public.agents,
    public.conv_details,
    public.conv_exec,
    public.reports,
    public.conv_cost,
    public.extortion_type
TO :"dashboard_user";

GRANT SELECT ON TABLE
    public.vw_dashboard_base,
    public.vw_ops_agent_quality_daily,
    public.vw_ops_last_20_conversations,
    public.vw_report_quality,
    public.vw_report_quality_daily,
    public.vw_temporal_performance_daily
TO :"dashboard_user";

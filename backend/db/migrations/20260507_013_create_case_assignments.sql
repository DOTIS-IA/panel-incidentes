-- Migration: 20260507_013_create_case_assignments.sql
-- Tabla de asignación de casos: registra qué incidentes fueron asignados a qué monitoristas

CREATE TABLE IF NOT EXISTS public.case_assignments (
    id              SERIAL PRIMARY KEY,
    id_conv         VARCHAR(50)  NOT NULL,
    assigned_to     INTEGER      NOT NULL REFERENCES public.users(id),
    assigned_by     INTEGER      NOT NULL REFERENCES public.users(id),
    assigned_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    status          VARCHAR(20)  NOT NULL DEFAULT 'asignado'
                        CHECK (status IN ('asignado', 'visto')),
    seen_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_case_assignments_id_conv      ON public.case_assignments (id_conv);
CREATE INDEX IF NOT EXISTS idx_case_assignments_assigned_to  ON public.case_assignments (assigned_to);
CREATE INDEX IF NOT EXISTS idx_case_assignments_status       ON public.case_assignments (status);

GRANT SELECT, INSERT, UPDATE ON public.case_assignments TO mas089_dashboard_ro;
GRANT USAGE, SELECT ON SEQUENCE public.case_assignments_id_seq TO mas089_dashboard_ro;

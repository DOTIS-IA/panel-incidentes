-- Migration: 20260507_012_add_new_roles.sql
-- Agrega los roles coordinador_incidentes y monitorista_incidentes al CHECK de public.users

ALTER TABLE public.users DROP CONSTRAINT users_role_check;

ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'monitor', 'operativo', 'coordinador_incidentes', 'monitorista_incidentes'));

-- Migration: 20260508_014_expand_role_column.sql
-- Amplía role de VARCHAR(20) a VARCHAR(30) para soportar los nuevos roles

ALTER TABLE public.users ALTER COLUMN role TYPE VARCHAR(30);

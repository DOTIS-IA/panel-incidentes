BEGIN;

-- Phase 1 expansion for reports.
-- Keep legacy scalar acc_number and acc_holder to avoid breaking current sync and views.
-- New array columns are added in parallel and backfilled from current values when present.

ALTER TABLE public.reports
    ADD COLUMN IF NOT EXISTS required_amount numeric(12,2)[],
    ADD COLUMN IF NOT EXISTS deposited_amount numeric(12,2)[],
    ADD COLUMN IF NOT EXISTS demand_type text,
    ADD COLUMN IF NOT EXISTS acc_numbers text[],
    ADD COLUMN IF NOT EXISTS acc_holders text[];

UPDATE public.reports
SET
    acc_numbers = CASE
        WHEN acc_number IS NULL OR btrim(acc_number) = '' THEN NULL
        ELSE ARRAY[acc_number::text]
    END,
    acc_holders = CASE
        WHEN acc_holder IS NULL OR btrim(acc_holder) = '' THEN NULL
        ELSE ARRAY[acc_holder::text]
    END
WHERE
    acc_numbers IS NULL
    OR acc_holders IS NULL;

COMMIT;

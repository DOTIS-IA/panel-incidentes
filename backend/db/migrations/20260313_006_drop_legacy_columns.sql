BEGIN;

DO $$
DECLARE
    dependency_count integer;
BEGIN
    SELECT COUNT(*)
    INTO dependency_count
    FROM information_schema.view_column_usage
    WHERE table_schema = 'public'
      AND table_name IN ('conv_details', 'reports')
      AND column_name IN ('updated_at', 'acc_number', 'acc_holder', 'amount');

    IF dependency_count > 0 THEN
        RAISE EXCEPTION
            'Cannot drop legacy columns: % active view dependencies still exist',
            dependency_count;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'acc_number'
    ) THEN
        EXECUTE $sql$
            UPDATE public.reports
            SET
                acc_numbers = CASE
                    WHEN acc_numbers IS NOT NULL THEN acc_numbers
                    WHEN acc_number IS NULL OR btrim(acc_number) = '' THEN NULL
                    ELSE ARRAY[acc_number::text]
                END,
                acc_holders = CASE
                    WHEN acc_holders IS NOT NULL THEN acc_holders
                    WHEN acc_holder IS NULL OR btrim(acc_holder) = '' THEN NULL
                    ELSE ARRAY[acc_holder::text]
                END
            WHERE
                (acc_numbers IS NULL AND acc_number IS NOT NULL AND btrim(acc_number) <> '')
                OR (acc_holders IS NULL AND acc_holder IS NOT NULL AND btrim(acc_holder) <> '');
        $sql$;
    END IF;
END $$;

ALTER TABLE public.conv_details
    DROP COLUMN IF EXISTS updated_at;

ALTER TABLE public.reports
    DROP COLUMN IF EXISTS acc_number,
    DROP COLUMN IF EXISTS acc_holder,
    DROP COLUMN IF EXISTS amount;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version text PRIMARY KEY,
    description text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_migrations (version, description)
VALUES (
    '20260313_006_drop_legacy_columns',
    'Drop updated_at, acc_number, acc_holder, amount after compatibility rollout'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;

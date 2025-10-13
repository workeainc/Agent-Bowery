-- Relax legacy webhook_events constraints to coexist with new columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_events' AND column_name = 'idem_key'
  ) THEN
    ALTER TABLE webhook_events ALTER COLUMN idem_key DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_events' AND column_name = 'raw_body'
  ) THEN
    ALTER TABLE webhook_events ALTER COLUMN raw_body DROP NOT NULL;
  END IF;
END $$;


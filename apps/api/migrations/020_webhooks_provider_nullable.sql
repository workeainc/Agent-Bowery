-- Relax legacy provider column nullability if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'webhook_events' AND column_name = 'provider'
  ) THEN
    ALTER TABLE webhook_events ALTER COLUMN provider DROP NOT NULL;
  END IF;
END $$;

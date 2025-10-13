-- Add payload column to store parsed JSON alongside raw_body
ALTER TABLE IF EXISTS webhook_events
  ADD COLUMN IF NOT EXISTS payload JSONB;

CREATE INDEX IF NOT EXISTS ix_webhook_events_payload ON webhook_events USING GIN (payload);


-- Add computed_idempotency_key used by controller logic and idempotent processing
ALTER TABLE IF EXISTS webhook_events
  ADD COLUMN IF NOT EXISTS computed_idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ux_webhook_events_computed_idem
  ON webhook_events(computed_idempotency_key);


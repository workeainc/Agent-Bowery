-- Align webhook_events schema with controller usage
ALTER TABLE IF EXISTS webhook_events
  ADD COLUMN IF NOT EXISTS organization_id TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT;

-- Optional indexes for filtering
CREATE INDEX IF NOT EXISTS ix_webhook_events_org ON webhook_events(organization_id);
CREATE INDEX IF NOT EXISTS ix_webhook_events_provider ON webhook_events(provider);


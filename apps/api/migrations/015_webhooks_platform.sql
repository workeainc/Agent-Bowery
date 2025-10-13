-- Add platform column expected by controller for webhook_events
ALTER TABLE IF EXISTS webhook_events
  ADD COLUMN IF NOT EXISTS platform TEXT;

CREATE INDEX IF NOT EXISTS ix_webhook_events_platform ON webhook_events(platform);


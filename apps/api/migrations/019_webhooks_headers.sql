-- Add headers column if missing
ALTER TABLE IF EXISTS webhook_events
  ADD COLUMN IF NOT EXISTS headers JSONB;


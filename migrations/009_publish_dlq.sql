-- Publish Dead Letter Queue table
CREATE TABLE IF NOT EXISTS publish_dlq (
  id text PRIMARY KEY,
  schedule_id text,
  platform text NOT NULL,
  error text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publish_dlq_created_at ON publish_dlq(created_at);


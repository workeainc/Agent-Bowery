-- Webhook durability: persisted inbox and DLQ

CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    idem_key TEXT NOT NULL,
    signature TEXT,
    headers JSONB NOT NULL,
    raw_body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'received', -- received | queued | processed | failed
    attempts INTEGER NOT NULL DEFAULT 0,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_webhook_events_idem ON webhook_events(idem_key);
CREATE INDEX IF NOT EXISTS ix_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS ix_webhook_events_received_at ON webhook_events(received_at);

CREATE TABLE IF NOT EXISTS webhook_dlq (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    reason TEXT,
    headers JSONB NOT NULL,
    raw_body TEXT NOT NULL,
    attempts INTEGER NOT NULL,
    failed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);



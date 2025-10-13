-- Optional oauth_state materialization for audit/debug
CREATE TABLE IF NOT EXISTS oauth_state (
  id VARCHAR(64) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL,
  org_id VARCHAR(64) NOT NULL,
  nonce VARCHAR(128) NOT NULL,
  state_payload TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ NULL,
  correlation_id VARCHAR(128) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oauth_state_org_provider_created_at ON oauth_state (org_id, provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oauth_state_nonce ON oauth_state (nonce);

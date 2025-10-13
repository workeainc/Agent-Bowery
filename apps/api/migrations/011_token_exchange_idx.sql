-- token_exchanges for OAuth authorization code dedupe
CREATE TABLE IF NOT EXISTS token_exchanges (
  id VARCHAR(64) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL,
  authorization_code_hash VARCHAR(128) NOT NULL,
  org_id VARCHAR(64) NOT NULL,
  correlation_id VARCHAR(128) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_token_exchanges_provider_codehash ON token_exchanges (provider, authorization_code_hash);
CREATE INDEX IF NOT EXISTS idx_token_exchanges_org_created_at ON token_exchanges (org_id, created_at DESC);

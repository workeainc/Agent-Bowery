-- token_audit lifecycle events
CREATE TABLE IF NOT EXISTS token_audit (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  provider VARCHAR(32) NOT NULL,
  social_account_id VARCHAR(64) NOT NULL,
  event VARCHAR(32) NOT NULL, -- acquire | refresh_attempt | refresh_success | refresh_failure | proactive_refresh | reactive_refresh
  success BOOLEAN NOT NULL,
  reason TEXT NULL,
  expires_at TIMESTAMPTZ NULL,
  scopes TEXT NULL,
  correlation_id VARCHAR(128) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_audit_org_provider_created_at ON token_audit (organization_id, provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_audit_correlation_id ON token_audit (correlation_id);

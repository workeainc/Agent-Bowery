-- Token audit table for tracking exchanges and refresh attempts
CREATE TABLE token_audit (
    id TEXT PRIMARY KEY DEFAULT 'audit_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    exchange_type TEXT NOT NULL, -- 'proactive_refresh', 'reactive_refresh', 'initial_exchange'
    success BOOLEAN NOT NULL,
    error_message TEXT,
    old_token_id TEXT REFERENCES tokens(id),
    new_token_id TEXT REFERENCES tokens(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_token_audit_org_platform ON token_audit(organization_id, platform);
CREATE INDEX idx_token_audit_created_at ON token_audit(created_at);
CREATE INDEX idx_token_audit_type ON token_audit(exchange_type);

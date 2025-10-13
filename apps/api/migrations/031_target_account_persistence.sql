-- Migration: 031_target_account_persistence.sql
-- Description: Add target account persistence to schedules and enhance publishing targeting

-- Add target account fields to schedules table
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS target_account_id text,
ADD COLUMN IF NOT EXISTS target_account_name text,
ADD COLUMN IF NOT EXISTS target_account_type text,
ADD COLUMN IF NOT EXISTS target_account_metadata jsonb DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN schedules.target_account_id IS 'External account ID (Facebook Page ID, LinkedIn Company ID, etc.)';
COMMENT ON COLUMN schedules.target_account_name IS 'Human-readable account name for display';
COMMENT ON COLUMN schedules.target_account_type IS 'Type of account (page, company, profile, etc.)';
COMMENT ON COLUMN schedules.target_account_metadata IS 'Additional account-specific metadata';

-- Add index for target account queries
CREATE INDEX IF NOT EXISTS idx_schedules_target_account ON schedules(target_account_id);

-- Add index for organization + target account queries
CREATE INDEX IF NOT EXISTS idx_schedules_org_target ON schedules(organization_id, target_account_id);

-- Create target accounts table for managing available accounts per organization
CREATE TABLE IF NOT EXISTS target_accounts (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    account_metadata JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, platform, account_id)
);

-- Add indexes for target accounts
CREATE INDEX IF NOT EXISTS idx_target_accounts_org_platform ON target_accounts(organization_id, platform);
CREATE INDEX IF NOT EXISTS idx_target_accounts_active ON target_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_target_accounts_synced ON target_accounts(last_synced_at);

-- Add comments for target accounts table
COMMENT ON TABLE target_accounts IS 'Available target accounts for publishing per organization and platform';
COMMENT ON COLUMN target_accounts.account_id IS 'External platform account ID';
COMMENT ON COLUMN target_accounts.account_name IS 'Human-readable account name';
COMMENT ON COLUMN target_accounts.account_type IS 'Type of account (page, company, profile, etc.)';
COMMENT ON COLUMN target_accounts.account_metadata IS 'Platform-specific account metadata';
COMMENT ON COLUMN target_accounts.is_active IS 'Whether this account is available for publishing';
COMMENT ON COLUMN target_accounts.last_synced_at IS 'Last time account info was synced from platform';

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_target_accounts_updated_at 
    BEFORE UPDATE ON target_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint for schedules target_account_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'schedules_target_account_id_fkey'
    ) THEN
        ALTER TABLE schedules 
        ADD CONSTRAINT schedules_target_account_id_fkey 
        FOREIGN KEY (target_account_id) REFERENCES target_accounts(id);
    END IF;
END $$;

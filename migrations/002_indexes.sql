-- Recommended indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedules_time_platform ON schedules(scheduled_at, platform);
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads(status, created_at);
CREATE INDEX IF NOT EXISTS idx_tokens_account_created ON tokens(social_account_id, created_at);

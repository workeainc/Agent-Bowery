-- Migration: 030_content_generation_pipeline_enhancements.sql
-- Description: Add tables for batch generation and pipeline monitoring

-- Batch Generation Jobs Table
CREATE TABLE IF NOT EXISTS batch_generation_jobs (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_items INTEGER NOT NULL DEFAULT 0,
    completed_items INTEGER NOT NULL DEFAULT 0,
    failed_items INTEGER NOT NULL DEFAULT 0,
    progress INTEGER NOT NULL DEFAULT 0,
    results JSONB NOT NULL DEFAULT '[]',
    metadata JSONB NOT NULL DEFAULT '{}',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pipeline Progress Table
CREATE TABLE IF NOT EXISTS pipeline_progress (
    id SERIAL PRIMARY KEY,
    pipeline_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    current_stage INTEGER NOT NULL DEFAULT 0,
    total_stages INTEGER NOT NULL DEFAULT 0,
    progress INTEGER NOT NULL DEFAULT 0,
    stages JSONB NOT NULL DEFAULT '[]',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Circuit Breaker State Table
CREATE TABLE IF NOT EXISTS circuit_breaker_states (
    id SERIAL PRIMARY KEY,
    circuit_key VARCHAR(255) UNIQUE NOT NULL,
    state VARCHAR(50) NOT NULL DEFAULT 'CLOSED',
    failure_count INTEGER NOT NULL DEFAULT 0,
    last_failure_time TIMESTAMP,
    next_attempt_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Content Generation Analytics Table
CREATE TABLE IF NOT EXISTS content_generation_analytics (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    pipeline_id VARCHAR(255),
    content_item_id VARCHAR(255),
    generation_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    duration_ms INTEGER,
    tokens_used INTEGER,
    cost_usd DECIMAL(10, 4),
    quality_score DECIMAL(5, 2),
    brand_compliance_score DECIMAL(5, 2),
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_batch_generation_jobs_org_status ON batch_generation_jobs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_batch_generation_jobs_created_at ON batch_generation_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_pipeline_progress_status ON pipeline_progress(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_progress_created_at ON pipeline_progress(created_at);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_states_key ON circuit_breaker_states(circuit_key);
CREATE INDEX IF NOT EXISTS idx_content_generation_analytics_org ON content_generation_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_generation_analytics_type ON content_generation_analytics(generation_type);
CREATE INDEX IF NOT EXISTS idx_content_generation_analytics_created_at ON content_generation_analytics(created_at);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_batch_generation_jobs_updated_at 
    BEFORE UPDATE ON batch_generation_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_progress_updated_at 
    BEFORE UPDATE ON pipeline_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuit_breaker_states_updated_at 
    BEFORE UPDATE ON circuit_breaker_states 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE batch_generation_jobs IS 'Tracks batch content generation jobs and their progress';
COMMENT ON TABLE pipeline_progress IS 'Monitors individual content generation pipeline progress and stages';
COMMENT ON TABLE circuit_breaker_states IS 'Maintains circuit breaker state for service protection';
COMMENT ON TABLE content_generation_analytics IS 'Analytics data for content generation performance and costs';

COMMENT ON COLUMN batch_generation_jobs.results IS 'Array of individual brief results with status and content IDs';
COMMENT ON COLUMN batch_generation_jobs.metadata IS 'Job configuration and options';
COMMENT ON COLUMN pipeline_progress.stages IS 'Array of pipeline stages with their status and timing';
COMMENT ON COLUMN pipeline_progress.metadata IS 'Pipeline configuration and input data';
COMMENT ON COLUMN content_generation_analytics.tokens_used IS 'Number of AI tokens consumed for generation';
COMMENT ON COLUMN content_generation_analytics.cost_usd IS 'Estimated cost in USD for the generation';
COMMENT ON COLUMN content_generation_analytics.quality_score IS 'Generated content quality score (0-100)';
COMMENT ON COLUMN content_generation_analytics.brand_compliance_score IS 'Brand compliance score (0-100)';

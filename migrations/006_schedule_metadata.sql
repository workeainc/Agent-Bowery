-- Add metadata columns to schedules table for publish outcomes
ALTER TABLE schedules 
ADD COLUMN provider_id TEXT,
ADD COLUMN error_message TEXT,
ADD COLUMN job_id TEXT,
ADD COLUMN duration_ms INTEGER,
ADD COLUMN status_code INTEGER,
ADD COLUMN retry_after_seconds INTEGER;

-- Add index for job tracking
CREATE INDEX idx_schedules_job_id ON schedules (job_id);
CREATE INDEX idx_schedules_status_code ON schedules (status_code);

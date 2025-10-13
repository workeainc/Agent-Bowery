-- Migration 008: CMS Schema Fixes
-- This migration adds missing columns and fixes schema inconsistencies for the Content Management System

-- Step 1: Add missing columns to content_versions table first (no dependencies)
ALTER TABLE content_versions 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS summary text,
ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}';

-- Step 2: Add missing columns to content_items table
ALTER TABLE content_items 
ADD COLUMN IF NOT EXISTS author_id text,
ADD COLUMN IF NOT EXISTS approved_by text,
ADD COLUMN IF NOT EXISTS approved_at timestamptz,
ADD COLUMN IF NOT EXISTS approval_notes text,
ADD COLUMN IF NOT EXISTS adapted_previews jsonb DEFAULT '{}'::jsonb;

-- Step 3: Add current_version_id column with foreign key constraint
ALTER TABLE content_items 
ADD COLUMN IF NOT EXISTS current_version_id text;

-- Add foreign key constraint separately to avoid dependency issues
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'content_items_current_version_id_fkey'
    ) THEN
        ALTER TABLE content_items 
        ADD CONSTRAINT content_items_current_version_id_fkey 
        FOREIGN KEY (current_version_id) REFERENCES content_versions(id);
    END IF;
END $$;

-- Step 4: Add missing columns to schedules table for better tracking
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS adapted_content jsonb,
ADD COLUMN IF NOT EXISTS provider_id text,
ADD COLUMN IF NOT EXISTS error_message text,
ADD COLUMN IF NOT EXISTS job_id text,
ADD COLUMN IF NOT EXISTS duration_ms integer,
ADD COLUMN IF NOT EXISTS status_code integer,
ADD COLUMN IF NOT EXISTS retry_after_seconds integer;

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_items_current_version ON content_items(current_version_id);
CREATE INDEX IF NOT EXISTS idx_content_items_author ON content_items(author_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_versions_item ON content_versions(content_item_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

-- Step 6: Add constraints for data integrity (only if they don't exist)
DO $$
BEGIN
    -- Add content status constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_content_status'
    ) THEN
        ALTER TABLE content_items 
        ADD CONSTRAINT chk_content_status CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'ARCHIVED'));
    END IF;

    -- Add schedule status constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_schedule_status'
    ) THEN
        ALTER TABLE schedules 
        ADD CONSTRAINT chk_schedule_status CHECK (status IN ('pending', 'queued', 'published', 'failed', 'cancelled'));
    END IF;
END $$;

-- Step 7: Update content_type enum to include SOCIAL_POST
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'SOCIAL_POST' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'content_type')
    ) THEN
        ALTER TYPE content_type ADD VALUE 'SOCIAL_POST';
    END IF;
END $$;

-- Step 8: Add comments for documentation
COMMENT ON COLUMN content_items.current_version_id IS 'Reference to the current active version of this content';
COMMENT ON COLUMN content_items.author_id IS 'ID of the user who created this content';
COMMENT ON COLUMN content_items.approved_by IS 'ID of the user who approved this content';
COMMENT ON COLUMN content_items.approved_at IS 'Timestamp when content was approved';
COMMENT ON COLUMN content_items.approval_notes IS 'Notes from the approver';
COMMENT ON COLUMN content_items.adapted_previews IS 'JSON object containing platform-specific content adaptations';

COMMENT ON COLUMN content_versions.title IS 'Version-specific title (can override content item title)';
COMMENT ON COLUMN content_versions.summary IS 'Brief summary of this version';
COMMENT ON COLUMN content_versions.media_urls IS 'Array of media URLs associated with this version';

COMMENT ON COLUMN schedules.media_urls IS 'Media URLs for this scheduled post';
COMMENT ON COLUMN schedules.adapted_content IS 'Platform-specific adapted content for this schedule';
COMMENT ON COLUMN schedules.provider_id IS 'External provider ID after successful publishing';
COMMENT ON COLUMN schedules.error_message IS 'Error message if publishing failed';
COMMENT ON COLUMN schedules.job_id IS 'Background job ID for tracking';
COMMENT ON COLUMN schedules.duration_ms IS 'Publishing duration in milliseconds';
COMMENT ON COLUMN schedules.status_code IS 'HTTP status code from platform API';
COMMENT ON COLUMN schedules.retry_after_seconds IS 'Seconds to wait before retry';

-- Rollback Migration 008: CMS Schema Fixes
-- This script reverses the changes made in migration 008

-- Step 1: Remove comments
COMMENT ON COLUMN content_items.current_version_id IS NULL;
COMMENT ON COLUMN content_items.author_id IS NULL;
COMMENT ON COLUMN content_items.approved_by IS NULL;
COMMENT ON COLUMN content_items.approved_at IS NULL;
COMMENT ON COLUMN content_items.approval_notes IS NULL;
COMMENT ON COLUMN content_items.adapted_previews IS NULL;

COMMENT ON COLUMN content_versions.title IS NULL;
COMMENT ON COLUMN content_versions.summary IS NULL;
COMMENT ON COLUMN content_versions.media_urls IS NULL;

COMMENT ON COLUMN schedules.media_urls IS NULL;
COMMENT ON COLUMN schedules.adapted_content IS NULL;
COMMENT ON COLUMN schedules.provider_id IS NULL;
COMMENT ON COLUMN schedules.error_message IS NULL;
COMMENT ON COLUMN schedules.job_id IS NULL;
COMMENT ON COLUMN schedules.duration_ms IS NULL;
COMMENT ON COLUMN schedules.status_code IS NULL;
COMMENT ON COLUMN schedules.retry_after_seconds IS NULL;

-- Step 2: Remove constraints
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS chk_content_status;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS chk_schedule_status;

-- Step 3: Remove indexes
DROP INDEX IF EXISTS idx_content_items_current_version;
DROP INDEX IF EXISTS idx_content_items_author;
DROP INDEX IF EXISTS idx_content_items_status;
DROP INDEX IF EXISTS idx_content_versions_item;
DROP INDEX IF EXISTS idx_schedules_status;

-- Step 4: Remove foreign key constraint
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_current_version_id_fkey;

-- Step 5: Remove columns from schedules table
ALTER TABLE schedules 
DROP COLUMN IF EXISTS media_urls,
DROP COLUMN IF EXISTS adapted_content,
DROP COLUMN IF EXISTS provider_id,
DROP COLUMN IF EXISTS error_message,
DROP COLUMN IF EXISTS job_id,
DROP COLUMN IF EXISTS duration_ms,
DROP COLUMN IF EXISTS status_code,
DROP COLUMN IF EXISTS retry_after_seconds;

-- Step 6: Remove columns from content_items table
ALTER TABLE content_items 
DROP COLUMN IF EXISTS current_version_id,
DROP COLUMN IF EXISTS author_id,
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS approval_notes,
DROP COLUMN IF EXISTS adapted_previews;

-- Step 7: Remove columns from content_versions table
ALTER TABLE content_versions 
DROP COLUMN IF EXISTS title,
DROP COLUMN IF EXISTS summary,
DROP COLUMN IF EXISTS media_urls;

-- Note: We cannot remove the SOCIAL_POST enum value as PostgreSQL doesn't support removing enum values
-- This would require recreating the enum type and updating all references

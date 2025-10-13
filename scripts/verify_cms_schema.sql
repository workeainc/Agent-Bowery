-- Post-Migration Schema Verification Script
-- Run this after applying migration 008 to verify schema correctness

-- 1. Verify content_items table structure
SELECT 
    'content_items' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'content_items' 
AND column_name IN (
    'id', 'organization_id', 'type', 'title', 'slug', 'status',
    'current_version_id', 'author_id', 'approved_by', 'approved_at', 
    'approval_notes', 'adapted_previews', 'created_at', 'updated_at'
)
ORDER BY ordinal_position;

-- 2. Verify content_versions table structure
SELECT 
    'content_versions' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'content_versions' 
AND column_name IN (
    'id', 'content_item_id', 'version', 'title', 'body', 'summary', 
    'media_urls', 'metadata_json', 'created_at'
)
ORDER BY ordinal_position;

-- 3. Verify schedules table structure
SELECT 
    'schedules' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'schedules' 
AND column_name IN (
    'id', 'content_item_id', 'platform', 'scheduled_at', 'status', 'last_error',
    'media_urls', 'adapted_content', 'provider_id', 'error_message', 
    'job_id', 'duration_ms', 'status_code', 'retry_after_seconds',
    'created_at', 'updated_at'
)
ORDER BY ordinal_position;

-- 4. Verify foreign key constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('content_items', 'content_versions', 'schedules')
ORDER BY tc.table_name, tc.constraint_name;

-- 5. Verify check constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
AND tc.table_name IN ('content_items', 'schedules')
ORDER BY tc.table_name, tc.constraint_name;

-- 6. Verify indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('content_items', 'content_versions', 'schedules')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 7. Verify enum types
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('content_type', 'platform')
ORDER BY t.typname, e.enumsortorder;

-- 8. Test data integrity with sample data
-- This will fail if constraints are not properly set up
DO $$
DECLARE
    test_content_id text;
    test_version_id text;
BEGIN
    -- Test content item creation
    INSERT INTO content_items (id, organization_id, title, type, status, author_id)
    VALUES ('verify_ci_001', 'org_verify', 'Verification Test', 'BLOG', 'DRAFT', 'verify_user')
    RETURNING id INTO test_content_id;
    
    RAISE NOTICE 'Content item created: %', test_content_id;
    
    -- Test version creation
    INSERT INTO content_versions (id, content_item_id, version, title, body, summary, media_urls)
    VALUES ('verify_cv_001', test_content_id, 1, 'Verification Version', 'Test body', 'Test summary', ARRAY['http://test.com/image.jpg'])
    RETURNING id INTO test_version_id;
    
    RAISE NOTICE 'Content version created: %', test_version_id;
    
    -- Test setting current version
    UPDATE content_items 
    SET current_version_id = test_version_id 
    WHERE id = test_content_id;
    
    RAISE NOTICE 'Current version set successfully';
    
    -- Test approval workflow
    UPDATE content_items 
    SET status = 'APPROVED', 
        approved_by = 'verify_admin',
        approved_at = now(),
        approval_notes = 'Verification approval',
        adapted_previews = '{"facebook": {"text": "adapted text"}}'::jsonb
    WHERE id = test_content_id;
    
    RAISE NOTICE 'Content approval test successful';
    
    -- Test schedule creation
    INSERT INTO schedules (id, content_item_id, platform, scheduled_at, status, media_urls, adapted_content)
    VALUES ('verify_sch_001', test_content_id, 'FACEBOOK', now() + interval '1 hour', 'pending', ARRAY['http://test.com/image.jpg'], '{"text": "scheduled content"}'::jsonb);
    
    RAISE NOTICE 'Schedule creation test successful';
    
    -- Cleanup
    DELETE FROM schedules WHERE id = 'verify_sch_001';
    DELETE FROM content_items WHERE id = test_content_id;
    
    RAISE NOTICE 'Verification test completed successfully - all constraints working';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Verification test failed: %', SQLERRM;
        -- Cleanup on error
        DELETE FROM schedules WHERE content_item_id = test_content_id;
        DELETE FROM content_items WHERE id = test_content_id;
        RAISE;
END $$;

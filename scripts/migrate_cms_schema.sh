#!/bin/bash
# Safe Migration Script for CMS Schema Fixes
# This script applies the migration with proper error handling and verification

set -e  # Exit on any error

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-bowery}"
DB_USER="${DB_USER:-bowery}"

echo "🚀 Starting CMS Schema Migration..."
echo "Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Function to run SQL and capture output
run_sql() {
    local sql="$1"
    local description="$2"
    
    echo "📋 $description"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql" > /dev/null 2>&1; then
        echo "✅ Success"
    else
        echo "❌ Failed"
        return 1
    fi
    echo ""
}

# Function to check if migration is needed
check_migration_needed() {
    echo "🔍 Checking if migration is needed..."
    
    # Check if any of the new columns exist
    local check_sql="
        SELECT COUNT(*) as missing_columns FROM (
            SELECT 1 WHERE NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'content_items' AND column_name = 'current_version_id'
            )
            UNION ALL
            SELECT 1 WHERE NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'content_items' AND column_name = 'author_id'
            )
            UNION ALL
            SELECT 1 WHERE NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'content_versions' AND column_name = 'title'
            )
        ) as checks;
    "
    
    local missing_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$check_sql" | tr -d ' ')
    
    if [ "$missing_count" -gt 0 ]; then
        echo "📝 Migration needed: $missing_count columns missing"
        return 0
    else
        echo "✅ Migration already applied - all columns exist"
        return 1
    fi
}

# Function to backup database (optional)
backup_database() {
    if [ "$BACKUP_BEFORE_MIGRATION" = "true" ]; then
        echo "💾 Creating database backup..."
        local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$backup_file"
        echo "✅ Backup created: $backup_file"
        echo ""
    fi
}

# Function to apply migration
apply_migration() {
    echo "🔧 Applying migration..."
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "migrations/008_cms_schema_fixes.sql"; then
        echo "✅ Migration applied successfully"
        return 0
    else
        echo "❌ Migration failed"
        return 1
    fi
}

# Function to verify migration
verify_migration() {
    echo "🔍 Verifying migration..."
    
    # Check all required columns exist
    local verify_sql="
        SELECT 
            'content_items' as table_name,
            column_name,
            data_type,
            is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'content_items' 
        AND column_name IN ('current_version_id', 'author_id', 'approved_by', 'approved_at', 'approval_notes', 'adapted_previews')
        
        UNION ALL
        
        SELECT 
            'content_versions' as table_name,
            column_name,
            data_type,
            is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'content_versions' 
        AND column_name IN ('title', 'summary', 'media_urls')
        
        ORDER BY table_name, column_name;
    "
    
    echo "📊 Schema verification results:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$verify_sql"
    echo ""
    
    # Check constraints
    local constraint_sql="
        SELECT 
            tc.table_name,
            tc.constraint_name,
            tc.constraint_type
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_name IN ('chk_content_status', 'chk_schedule_status', 'content_items_current_version_id_fkey')
        ORDER BY tc.table_name, tc.constraint_name;
    "
    
    echo "🔒 Constraint verification:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$constraint_sql"
    echo ""
    
    # Check indexes
    local index_sql="
        SELECT 
            schemaname,
            tablename,
            indexname
        FROM pg_indexes 
        WHERE indexname LIKE 'idx_content_%' OR indexname LIKE 'idx_schedules_%'
        ORDER BY tablename, indexname;
    "
    
    echo "📈 Index verification:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$index_sql"
    echo ""
}

# Function to test CMS functionality
test_cms_functionality() {
    echo "🧪 Testing CMS functionality..."
    
    # Test content creation
    local test_sql="
        -- Test content item creation
        INSERT INTO content_items (id, organization_id, title, type, status, author_id)
        VALUES ('test_ci_001', 'org_test', 'Test Content', 'BLOG', 'DRAFT', 'test_user')
        RETURNING id;
    "
    
    local content_id=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$test_sql" | tr -d ' ')
    
    if [ -n "$content_id" ]; then
        echo "✅ Content item created: $content_id"
        
        # Test version creation
        local version_sql="
            INSERT INTO content_versions (id, content_item_id, version, title, body, summary, media_urls)
            VALUES ('test_cv_001', '$content_id', 1, 'Test Version', 'Test body content', 'Test summary', ARRAY['http://example.com/image.jpg'])
            RETURNING id;
        "
        
        local version_id=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$version_sql" | tr -d ' ')
        
        if [ -n "$version_id" ]; then
            echo "✅ Content version created: $version_id"
            
            # Test setting current version
            local set_version_sql="
                UPDATE content_items 
                SET current_version_id = '$version_id' 
                WHERE id = '$content_id';
            "
            
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$set_version_sql" > /dev/null 2>&1; then
                echo "✅ Current version set successfully"
            else
                echo "❌ Failed to set current version"
            fi
            
            # Test approval
            local approve_sql="
                UPDATE content_items 
                SET status = 'APPROVED', 
                    approved_by = 'test_admin',
                    approved_at = now(),
                    approval_notes = 'Test approval',
                    adapted_previews = '{\"facebook\": {\"text\": \"adapted text\"}}'::jsonb
                WHERE id = '$content_id';
            "
            
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$approve_sql" > /dev/null 2>&1; then
                echo "✅ Content approval test successful"
            else
                echo "❌ Content approval test failed"
            fi
        else
            echo "❌ Failed to create content version"
        fi
        
        # Cleanup test data
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM content_items WHERE id = '$content_id';" > /dev/null 2>&1
        echo "🧹 Test data cleaned up"
    else
        echo "❌ Failed to create test content item"
    fi
    
    echo ""
}

# Main execution
main() {
    echo "🎯 CMS Schema Migration Script"
    echo "=============================="
    echo ""
    
    # Check if migration is needed
    if ! check_migration_needed; then
        echo "✅ Migration not needed - exiting"
        exit 0
    fi
    
    # Create backup if requested
    backup_database
    
    # Apply migration
    if apply_migration; then
        echo ""
        verify_migration
        echo ""
        test_cms_functionality
        
        echo "🎉 Migration completed successfully!"
        echo ""
        echo "📋 Next steps:"
        echo "1. Test your API endpoints"
        echo "2. Verify frontend integration"
        echo "3. Monitor application logs"
        echo ""
    else
        echo "❌ Migration failed - check logs above"
        echo ""
        echo "🔄 To rollback (if needed):"
        echo "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/008_cms_schema_fixes_rollback.sql"
        exit 1
    fi
}

# Run main function
main "$@"

-- Migration: Add role and organization_id columns to existing users table
-- This migration adds the missing columns for proper authentication

-- Add role column with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer'));

-- Add organization_id column with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255) DEFAULT 'org_chauncey';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Update existing users with proper roles (assuming they are admins for now)
UPDATE users SET role = 'admin' WHERE role IS NULL OR role = 'viewer';

-- Insert default users if they don't exist
INSERT INTO users (id, email, display_name, role, organization_id, password_hash, created_at, updated_at)
VALUES (
    'user_admin_default',
    'admin@agentbowery.com',
    'Admin User',
    'admin',
    'org_chauncey',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8K8K8K8K8K', -- Placeholder hash
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, display_name, role, organization_id, password_hash, created_at, updated_at)
VALUES (
    'user_editor_default',
    'editor@agentbowery.com',
    'Editor User',
    'editor',
    'org_chauncey',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8K8K8K8K8K', -- Placeholder hash
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, display_name, role, organization_id, password_hash, created_at, updated_at)
VALUES (
    'user_viewer_default',
    'viewer@agentbowery.com',
    'Viewer User',
    'viewer',
    'org_chauncey',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8K8K8K8K8K', -- Placeholder hash
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

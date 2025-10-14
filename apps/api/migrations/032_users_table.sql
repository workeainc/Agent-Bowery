-- Migration: Create users table for authentication
-- This migration creates the users table with proper security constraints

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    organization_id VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: password123)
-- Password hash for 'password123' with bcrypt salt rounds 12
INSERT INTO users (id, email, name, role, organization_id, password_hash, created_at, updated_at)
VALUES (
    'user_admin_default',
    'admin@agentbowery.com',
    'Admin User',
    'admin',
    'org_chauncey',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8K8K8K8K8K', -- This is a placeholder - will be updated with real hash
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert default editor user (password: password123)
INSERT INTO users (id, email, name, role, organization_id, password_hash, created_at, updated_at)
VALUES (
    'user_editor_default',
    'editor@agentbowery.com',
    'Editor User',
    'editor',
    'org_chauncey',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8K8K8K8K8K', -- This is a placeholder - will be updated with real hash
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert default viewer user (password: password123)
INSERT INTO users (id, email, name, role, organization_id, password_hash, created_at, updated_at)
VALUES (
    'user_viewer_default',
    'viewer@agentbowery.com',
    'Viewer User',
    'viewer',
    'org_chauncey',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8K8K8K8K8K', -- This is a placeholder - will be updated with real hash
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;



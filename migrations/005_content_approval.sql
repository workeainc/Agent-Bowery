-- Add approval and versioning columns to content_items
ALTER TABLE content_items 
ADD COLUMN current_version_id TEXT REFERENCES content_versions(id),
ADD COLUMN approved_by TEXT,
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approval_notes TEXT;

-- Add indexes for performance
CREATE INDEX idx_content_items_status ON content_items (status);
CREATE INDEX idx_content_items_type ON content_items (type);
CREATE INDEX idx_content_items_org_status ON content_items (organization_id, status);
CREATE INDEX idx_content_items_org_type ON content_items (organization_id, type);

-- Add indexes for content_versions
CREATE INDEX idx_content_versions_item_id ON content_versions (content_item_id);
CREATE INDEX idx_content_versions_created_at ON content_versions (created_at);

-- Add indexes for schedules
CREATE INDEX idx_schedules_content_item ON schedules (content_item_id);
CREATE INDEX idx_schedules_status_created ON schedules (status, created_at);

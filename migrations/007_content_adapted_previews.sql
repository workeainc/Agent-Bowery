-- Add adapted_previews column to content_items for storing platform-specific adaptations
ALTER TABLE content_items 
ADD COLUMN adapted_previews JSONB;

-- Add index for querying adapted content
CREATE INDEX idx_content_items_adapted_previews ON content_items USING GIN (adapted_previews);

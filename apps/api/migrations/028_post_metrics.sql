-- 028_post_metrics.sql
CREATE TABLE IF NOT EXISTS post_metrics (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content_item_id text NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  platform text NOT NULL,
  template_version_id text,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  reactions integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  ctr numeric DEFAULT 0.0,
  posted_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for performance queries
CREATE INDEX IF NOT EXISTS idx_post_metrics_content_platform ON post_metrics(content_item_id, platform);
CREATE INDEX IF NOT EXISTS idx_post_metrics_template ON post_metrics(template_version_id);
CREATE INDEX IF NOT EXISTS idx_post_metrics_posted_at ON post_metrics(posted_at);




-- 027_system_flags.sql
CREATE TABLE IF NOT EXISTS system_flags (
  id text PRIMARY KEY DEFAULT 'global',
  global_pause boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO system_flags (id, global_pause) VALUES ('global', false) ON CONFLICT (id) DO NOTHING;






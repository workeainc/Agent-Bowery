-- Seed data for local testing
INSERT INTO organizations (id, name) VALUES ('org_chauncey', 'ChaunceyAllPro LLC') ON CONFLICT DO NOTHING;

INSERT INTO users (id, email, display_name, password_hash)
VALUES ('user_admin', 'admin@chaunceyallpro.com', 'Admin', '$2b$10$examplehashplaceholder')
ON CONFLICT DO NOTHING;

INSERT INTO user_organizations (id, user_id, organization_id, role)
VALUES ('uo_admin', 'user_admin', 'org_chauncey', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, organization_id, type, title, slug, status)
VALUES ('content_blog1', 'org_chauncey', 'BLOG', 'Welcome to ChaunceyAllPro', 'welcome-chauncey', 'draft')
ON CONFLICT DO NOTHING;

INSERT INTO content_versions (id, content_item_id, version, body)
VALUES ('ver1', 'content_blog1', 1, 'Initial draft body')
ON CONFLICT DO NOTHING;

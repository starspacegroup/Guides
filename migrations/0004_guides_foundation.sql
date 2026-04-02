-- Guides foundation schema extensions
-- Aligns the CMS model to section-based guide publishing with contributor controls and revisions.

-- 1) Extend content_types to support guide-section behavior and access policy.
ALTER TABLE content_types ADD COLUMN purpose TEXT NOT NULL DEFAULT 'general' CHECK (purpose IN ('general', 'guide_section'));
ALTER TABLE content_types ADD COLUMN submission_policy TEXT NOT NULL DEFAULT 'admin_only' CHECK (submission_policy IN ('admin_only', 'trusted_members', 'all_members'));
ALTER TABLE content_types ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private'));

-- 2) Extend content_items for editor metadata and quick summary display.
ALTER TABLE content_items ADD COLUMN editor_format TEXT NOT NULL DEFAULT 'markdown' CHECK (editor_format IN ('markdown', 'richtext', 'plaintext'));
ALTER TABLE content_items ADD COLUMN summary TEXT;
ALTER TABLE content_items ADD COLUMN last_edited_by TEXT REFERENCES users(id) ON DELETE SET NULL;

-- 3) Contributor permissions per section (content type).
CREATE TABLE IF NOT EXISTS section_contributors (
  id TEXT PRIMARY KEY,
  content_type_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'reviewer')),
  granted_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (content_type_id, user_id),
  FOREIGN KEY (content_type_id) REFERENCES content_types(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 4) Guide revision history for collaborative editing and rollback.
CREATE TABLE IF NOT EXISTS guide_revisions (
  id TEXT PRIMARY KEY,
  content_item_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  fields_snapshot TEXT NOT NULL DEFAULT '{}',
  change_summary TEXT,
  edited_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (content_item_id, revision_number),
  FOREIGN KEY (content_item_id) REFERENCES content_items(id) ON DELETE CASCADE,
  FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5) Helpful indexes for read/write patterns.
CREATE INDEX IF NOT EXISTS idx_content_types_purpose ON content_types(purpose);
CREATE INDEX IF NOT EXISTS idx_content_types_submission_policy ON content_types(submission_policy);
CREATE INDEX IF NOT EXISTS idx_content_items_editor_format ON content_items(editor_format);
CREATE INDEX IF NOT EXISTS idx_content_items_last_edited_by ON content_items(last_edited_by);
CREATE INDEX IF NOT EXISTS idx_section_contributors_type ON section_contributors(content_type_id);
CREATE INDEX IF NOT EXISTS idx_section_contributors_user ON section_contributors(user_id);
CREATE INDEX IF NOT EXISTS idx_guide_revisions_item ON guide_revisions(content_item_id);
CREATE INDEX IF NOT EXISTS idx_guide_revisions_editor ON guide_revisions(edited_by);

-- 6) Mark the initial Guides section as a guide section with member-friendly submissions.
UPDATE content_types
SET purpose = 'guide_section', submission_policy = 'trusted_members', visibility = 'public'
WHERE slug = 'user-interfaces';

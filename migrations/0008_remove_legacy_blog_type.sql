-- Remove the legacy system blog type so production only surfaces guide collections.
DELETE FROM content_types
WHERE slug = 'blog'
  AND is_system = 1;

-- Ensure the built-in section is treated as a guide section when synced in older environments.
UPDATE content_types
SET purpose = 'guide_section',
    submission_policy = 'trusted_members',
    visibility = 'public',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'user-interface';
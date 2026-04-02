-- Rename initial guide section slug/name from plural to singular.
-- Handles either or both slugs existing.

-- 1) If both slugs exist, move old content items to the new slug row.
UPDATE content_items
SET content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interfaces' LIMIT 1)
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interfaces');

-- 2) If both slugs exist, merge section contributor permissions.
INSERT OR IGNORE INTO section_contributors (id, content_type_id, user_id, role, granted_by, created_at)
SELECT
  lower(hex(randomblob(16))),
  (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1),
  sc.user_id,
  sc.role,
  sc.granted_by,
  sc.created_at
FROM section_contributors sc
WHERE sc.content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interfaces' LIMIT 1)
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interfaces');

DELETE FROM section_contributors
WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interfaces' LIMIT 1)
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interfaces');

-- 3) If both slugs exist, merge tags safely.
-- Rewire item->tag links from old duplicate tags to matching new tags.
INSERT OR IGNORE INTO content_item_tags (content_item_id, content_tag_id)
SELECT
  cit.content_item_id,
  nt.id
FROM content_item_tags cit
JOIN content_tags ot ON ot.id = cit.content_tag_id
JOIN content_tags nt ON nt.slug = ot.slug
WHERE ot.content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interfaces' LIMIT 1)
  AND nt.content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interfaces');

DELETE FROM content_item_tags
WHERE content_tag_id IN (
  SELECT ot.id
  FROM content_tags ot
  JOIN content_tags nt ON nt.slug = ot.slug
  WHERE ot.content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interfaces' LIMIT 1)
    AND nt.content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
)
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interfaces');

DELETE FROM content_tags
WHERE id IN (
  SELECT ot.id
  FROM content_tags ot
  JOIN content_tags nt ON nt.slug = ot.slug
  WHERE ot.content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interfaces' LIMIT 1)
    AND nt.content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
)
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interfaces');

UPDATE content_tags
SET content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interfaces' LIMIT 1)
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interfaces');

-- 4) If both slugs exist, remove the old slug row now that references are migrated.
DELETE FROM content_types
WHERE slug = 'user-interfaces'
  AND EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface');

-- 5) If only legacy slug exists, rename it.
UPDATE content_types
SET slug = 'user-interface'
WHERE slug = 'user-interfaces'
  AND NOT EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface');

-- 6) Finalize display name and routePrefix on canonical slug.
UPDATE content_types
SET name = 'User Interface'
WHERE slug = 'user-interface';

UPDATE content_types
SET settings = CASE
  WHEN json_valid(settings) THEN json_set(settings, '$.routePrefix', '/user-interface')
  ELSE settings
END
WHERE slug = 'user-interface';

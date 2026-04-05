ALTER TABLE content_items ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
	SELECT id, ROW_NUMBER() OVER (PARTITION BY content_type_id ORDER BY created_at ASC, id ASC) - 1 AS row_number
	FROM content_items
)
UPDATE content_items
SET sort_order = (
	SELECT ranked.row_number
	FROM ranked
	WHERE ranked.id = content_items.id
)
WHERE id IN (SELECT id FROM ranked);

CREATE INDEX IF NOT EXISTS idx_content_items_sort_order ON content_items(content_type_id, sort_order);
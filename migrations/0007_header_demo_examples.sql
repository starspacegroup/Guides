-- Add optional header demo support for article-style guides.

UPDATE content_types
SET fields = json_insert(
	fields,
	'$[#]',
	json('{"name":"header_demo","label":"Header Demo","type":"select","options":[{"label":"Theme Toggle: Next Action","value":"theme-toggle-next-action"}],"helpText":"Optional working component shown in the article header.","sortOrder":3}')
)
WHERE slug = 'ui-patterns'
	AND json_valid(fields)
	AND NOT EXISTS (
		SELECT 1
		FROM json_each(fields)
		WHERE json_extract(json_each.value, '$.name') = 'header_demo'
	);

UPDATE content_items
SET
	fields = json_set(
		CASE
			WHEN json_valid(fields) THEN fields
			ELSE '{}'
		END,
		'$.header_demo',
		'theme-toggle-next-action'
	),
	updated_at = CURRENT_TIMESTAMP
WHERE slug = 'theme-toggle-action-icons'
	AND content_type_id IN (SELECT id FROM content_types WHERE slug = 'ui-patterns');
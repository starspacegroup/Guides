-- Add practical production playbooks to level up the user-interface guide set.

INSERT INTO content_tags (id, content_type_id, name, slug)
SELECT
	lower(hex(randomblob(16))),
	(SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1),
	'Performance',
	'performance'
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_tags
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'performance'
	);

INSERT INTO content_tags (id, content_type_id, name, slug)
SELECT
	lower(hex(randomblob(16))),
	(SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1),
	'Operations',
	'operations'
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_tags
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'operations'
	);

INSERT INTO content_items (
	id,
	content_type_id,
	slug,
	title,
	status,
	fields,
	seo_title,
	seo_description,
	summary,
	editor_format,
	published_at,
	sort_order
)
SELECT
	lower(hex(randomblob(16))),
	(SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1),
	'theme-system-hardening-checklist',
	'Theme System Hardening Checklist',
	'published',
	json_object(
		'excerpt',
		'An operator-grade checklist for shipping themes without regressions in SSR, hydration, and accessibility.',
		'body',
		'# Theme System Hardening Checklist\n\n## Why this exists\nTheming failures are expensive because they break first impressions, accessibility, and trust. This checklist is designed for release day and post-release monitoring.\n\n## Architecture baseline\n- preference state: light, dark, system\n- system state from media query\n- resolved state used by document root\n- CSS tokens mapped through semantic variables\n\n## Pre-release checklist\n### SSR and first paint\n- inline bootstrap sets data-theme before app hydration\n- no first paint flash on both light and dark\n- hydration warnings remain at zero\n\n### State and persistence\n- invalid storage values are sanitized\n- cross-tab sync works via storage event\n- preference survives full restart\n\n### Accessibility and contrast\n- critical semantic pairs pass AA\n- focus ring tokens are visible in both themes\n- disabled and muted states are visually distinct\n\n### UI behavior\n- theme toggle icon communicates next action\n- aria labels match the actual action\n- transitions are smooth and non-blocking\n\n## Reference implementation\n```ts\nexport function resolveTheme(pref: "light" | "dark" | "system", system: "light" | "dark"): "light" | "dark" {\n  return pref === "system" ? system : pref;\n}\n\nexport function applyTheme(theme: "light" | "dark", doc: Document = document) {\n  doc.documentElement.setAttribute("data-theme", theme);\n}\n```\n\n## Release telemetry\nTrack event counts and rates for:\n- theme_preference_changed\n- theme_resolved\n- theme_bootstrap_fallback_used\n- theme_contrast_validation_failed\n\n## Incident response\nIf regressions appear:\n1. freeze theme token changes\n2. roll back last token rename\n3. run contrast validator and store tests\n4. patch bootstrap script first\n\n## Done definition\nTheme work is complete only when store tests, e2e smoke, and contrast checks pass in CI and in local preflight.',
		'difficulty',
		'advanced',
		'read_time',
		13
	),
	'Theme System Hardening Checklist',
	'Operator-grade checklist for shipping robust themes across SSR, hydration, accessibility, and telemetry.',
	'Operator-grade checklist for shipping robust themes across SSR, hydration, accessibility, and telemetry.',
	'markdown',
	CURRENT_TIMESTAMP,
	70
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_items
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'theme-system-hardening-checklist'
	);

INSERT INTO content_items (
	id,
	content_type_id,
	slug,
	title,
	status,
	fields,
	seo_title,
	seo_description,
	summary,
	editor_format,
	published_at,
	sort_order
)
SELECT
	lower(hex(randomblob(16))),
	(SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1),
	'command-palette-power-patterns',
	'Command Palette Power Patterns',
	'published',
	json_object(
		'excerpt',
		'A practical command palette standard with ranking strategy, async safety, and keyboard-first ergonomics.',
		'body',
		'# Command Palette Power Patterns\n\n## Product outcome\nA command palette should feel instant, trustworthy, and keyboard-native under real user load.\n\n## Core contract\nEvery command has:\n- stable id\n- label and description\n- category\n- optional shortcut prefix\n- execute handler with controlled side effects\n\n## Ranking strategy\nUse weighted scoring:\n- exact id or name match: 100\n- prefix shortcut match: 95\n- startsWith: 80\n- includes: 50\n- recent usage boost: +10\n\n## Safety patterns\n- prevent duplicate execute on key repeat\n- debounce heavy search operations\n- isolate async command failures and show toast\n- keep parser pure for unit tests\n\n## Keyboard contract\n- Cmd or Ctrl + K opens\n- Cmd or Ctrl + Shift + P opens\n- Arrow keys cycle\n- Enter executes highlighted item\n- Escape clears query, then closes\n\n## Reference parser\n```ts\nexport function parseShortcutQuery(input: string): { shortcut: string; payload: string } | null {\n  const trimmed = input.trim();\n  const match = trimmed.match(/^(\\w+)\\s+(.+)$/);\n  if (!match) return null;\n  return { shortcut: match[1].toLowerCase(), payload: match[2] };\n}\n```\n\n## Observability\nCapture:\n- palette_opened\n- command_ranked\n- command_executed\n- command_failed\n- command_latency_ms\n\n## Performance targets\n- input to first ranked result under 50ms\n- arrow navigation no jank\n- open animation under 150ms\n\n## Anti-patterns\n- hardcoded commands inside component template\n- no ownership model for command providers\n- hidden keyboard shortcuts without discoverability hints',
		'difficulty',
		'advanced',
		'read_time',
		12
	),
	'Command Palette Power Patterns',
	'Practical command palette standard with ranking, async safety, keyboard semantics, and performance targets.',
	'Practical command palette standard with ranking, async safety, keyboard semantics, and performance targets.',
	'markdown',
	CURRENT_TIMESTAMP,
	80
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_items
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'command-palette-power-patterns'
	);

INSERT INTO content_items (
	id,
	content_type_id,
	slug,
	title,
	status,
	fields,
	seo_title,
	seo_description,
	summary,
	editor_format,
	published_at,
	sort_order
)
SELECT
	lower(hex(randomblob(16))),
	(SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1),
	'shortcut-governance-and-compatibility',
	'Shortcut Governance and Compatibility',
	'published',
	json_object(
		'excerpt',
		'Govern keyboard shortcuts as a product API with conflict policy, context guards, and compatibility testing.',
		'body',
		'# Shortcut Governance and Compatibility\n\n## Purpose\nShortcuts are a product API. They need ownership, versioning discipline, and compatibility standards.\n\n## Governance model\n- central registry for all global shortcuts\n- ownership metadata per shortcut\n- reserved combinations documented\n- deprecation path for changed shortcuts\n\n## Compatibility rules\n- use meta or ctrl abstraction\n- normalize key casing\n- avoid clobbering browser critical defaults\n- gate execution by focus context\n\n## Context guard utility\n```ts\nexport function shouldHandleGlobalShortcut(target: EventTarget | null): boolean {\n  const el = target as HTMLElement | null;\n  if (!el) return true;\n  const tag = (el.tagName || "").toLowerCase();\n  const editable = el.getAttribute("contenteditable") === "true";\n  return !editable && tag !== "input" && tag !== "textarea";\n}\n```\n\n## Conflict management\nIf conflict is detected:\n1. prefer browser critical behavior\n2. allow override only with explicit product decision\n3. emit telemetry for blocked shortcut events\n\n## Test suite requirements\n- unit tests for predicate logic\n- integration tests for lifecycle registration and cleanup\n- browser coverage in Chromium, Firefox, WebKit\n- OS coverage in macOS and Linux or Windows\n\n## Operational metrics\n- shortcut_used\n- shortcut_blocked\n- shortcut_conflict\n- shortcut_handler_error\n\n## Release checklist\n- registry updated\n- docs updated\n- keyboard QA completed\n- no duplicate listeners detected\n\n## Anti-patterns\n- shortcut logic scattered across nested components\n- no cleanup on route changes\n- direct key checks without modifier abstraction',
		'difficulty',
		'advanced',
		'read_time',
		11
	),
	'Shortcut Governance and Compatibility',
	'Govern keyboard shortcuts as a product API with conflict policy, context guards, and compatibility checks.',
	'Govern keyboard shortcuts as a product API with conflict policy, context guards, and compatibility checks.',
	'markdown',
	CURRENT_TIMESTAMP,
	90
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_items
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'shortcut-governance-and-compatibility'
	);

INSERT INTO content_item_tags (content_item_id, content_tag_id)
SELECT ci.id, ct.id
FROM content_items ci
JOIN content_tags ct ON ct.content_type_id = ci.content_type_id
WHERE ci.slug = 'theme-system-hardening-checklist'
	AND ct.slug IN ('theming', 'dark-mode', 'testing', 'operations', 'architecture')
	AND NOT EXISTS (
		SELECT 1 FROM content_item_tags x
		WHERE x.content_item_id = ci.id
			AND x.content_tag_id = ct.id
	);

INSERT INTO content_item_tags (content_item_id, content_tag_id)
SELECT ci.id, ct.id
FROM content_items ci
JOIN content_tags ct ON ct.content_type_id = ci.content_type_id
WHERE ci.slug = 'command-palette-power-patterns'
	AND ct.slug IN ('command-palette', 'keyboard-shortcuts', 'performance', 'operations', 'architecture')
	AND NOT EXISTS (
		SELECT 1 FROM content_item_tags x
		WHERE x.content_item_id = ci.id
			AND x.content_tag_id = ct.id
	);

INSERT INTO content_item_tags (content_item_id, content_tag_id)
SELECT ci.id, ct.id
FROM content_items ci
JOIN content_tags ct ON ct.content_type_id = ci.content_type_id
WHERE ci.slug = 'shortcut-governance-and-compatibility'
	AND ct.slug IN ('keyboard-shortcuts', 'testing', 'operations', 'architecture')
	AND NOT EXISTS (
		SELECT 1 FROM content_item_tags x
		WHERE x.content_item_id = ci.id
			AND x.content_tag_id = ct.id
	);
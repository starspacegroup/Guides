-- Seed cross-project UI guides focused on theme systems and command UX.
-- This migration is idempotent at row level via NOT EXISTS guards.

-- Ensure the user-interface guide section exists even before runtime sync.
INSERT INTO content_types (
	id,
	slug,
	name,
	description,
	fields,
	settings,
	icon,
	sort_order,
	is_system,
	purpose,
	submission_policy,
	visibility
)
SELECT
	lower(hex(randomblob(16))),
	'user-interface',
	'User Interface',
	'Section guides for UI implementation details and design decisions',
	json('[{"name":"excerpt","label":"Excerpt","type":"textarea","required":true},{"name":"body","label":"Guide Body","type":"richtext","required":true},{"name":"difficulty","label":"Difficulty","type":"select","defaultValue":"beginner"},{"name":"read_time","label":"Read Time (minutes)","type":"number"}]'),
	json('{"hasDrafts":true,"hasTags":true,"hasSEO":true,"hasAuthor":true,"routePrefix":"/user-interface","listPageSize":12,"defaultSort":"published_at","defaultSortDirection":"desc","isPublic":true,"listTemplate":"blog-list","itemTemplate":"blog-item"}'),
	'layout',
	0,
	1,
	'guide_section',
	'trusted_members',
	'public'
WHERE NOT EXISTS (
	SELECT 1 FROM content_types WHERE slug = 'user-interface'
);

-- Seed reusable taxonomy tags.
INSERT INTO content_tags (id, content_type_id, name, slug)
SELECT
	lower(hex(randomblob(16))),
	(SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1),
	'Theming',
	'theming'
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_tags
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'theming'
	);

INSERT INTO content_tags (id, content_type_id, name, slug)
SELECT
	lower(hex(randomblob(16))),
	(SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1),
	'Dark Mode',
	'dark-mode'
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_tags
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'dark-mode'
	);

INSERT INTO content_tags (id, content_type_id, name, slug)
SELECT
	lower(hex(randomblob(16))),
	(SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1),
	'Command Palette',
	'command-palette'
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_tags
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'command-palette'
	);

INSERT INTO content_tags (id, content_type_id, name, slug)
SELECT
	lower(hex(randomblob(16))),
	(SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1),
	'Keyboard Shortcuts',
	'keyboard-shortcuts'
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_tags
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'keyboard-shortcuts'
	);

-- Seed published guides derived from stable conventions in sibling projects.
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
	'theme-mode-resolution',
	'Theme Mode Resolution: Light, Dark, and System',
	'published',
	json_object(
		'excerpt',
		'A future-proof theme model separates preference, system state, and resolved output.',
		'body',
		'# Rule\nModel theme with three states: preference, system, and resolved.\n\n# Why\nProjects stay maintainable when user intent and OS signals are separate concerns.\n\n# Must\n- Store a user preference value: `light`, `dark`, or `system`.\n- Track system preference with `matchMedia("(prefers-color-scheme: dark)")`.\n- Derive resolved theme from preference + system state.\n- Persist preference in localStorage and apply via `data-theme` on `documentElement`.\n\n# Should\n- Subscribe to media query change events to react when OS theme changes.\n- Guard browser-only APIs in SSR contexts.\n\n# Source Patterns\n- Dashboard: theme store with `auto` behavior and localStorage persistence.\n- Guides and davis9001.dev: derived `resolvedTheme` store and media query listener.\n\n# Svelte Pattern\n```ts\nexport type ThemePreference = "light" | "dark" | "system";\nexport type ResolvedTheme = "light" | "dark";\n\nconst themePreference = writable<ThemePreference>("system");\nconst systemTheme = writable<ResolvedTheme>(\n  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"\n);\n\nexport const resolvedTheme = derived(\n  [themePreference, systemTheme],\n  ([$pref, $system]) => ($pref === "system" ? $system : $pref)\n);\n```\n\n# Validation Checklist\n- Theme survives reloads.\n- Switching OS theme updates app when preference is `system`.\n- No hydration errors from direct browser API access on server.\n',
		'difficulty',
		'intermediate',
		'read_time',
		7
	),
	'Theme Mode Resolution: Light, Dark, and System',
	'Implement a durable light/dark/system theme architecture with derived state and SSR-safe browser integration.',
	'Implement a durable light/dark/system theme architecture with derived state and SSR-safe browser integration.',
	'markdown',
	CURRENT_TIMESTAMP,
	10
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_items
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'theme-mode-resolution'
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
	'theme-token-architecture',
	'Theme Token Architecture with CSS Variables',
	'published',
	json_object(
		'excerpt',
		'Use tokenized CSS variables with dark overrides and derived colors for long-term consistency.',
		'body',
		'# Rule\nTheme all UI through CSS variables, not hardcoded component colors.\n\n# Why\nToken systems survive redesigns and product expansion without component churn.\n\n# Must\n- Define base tokens in `:root` (`--color-*`, `--spacing-*`, `--shadow-*`, `--transition-*`).\n- Override themeable tokens in `[data-theme="dark"]`.\n- Keep component styles on `var(--token)` usage only.\n- Maintain semantic status tokens such as `--success`, `--error`, and paired backgrounds.\n\n# Should\n- Use `color-mix()` to generate derived tones and states.\n- Keep naming predictable (`prefix-scale` like `--spacing-sm`, `--radius-lg`).\n\n# Source Patterns\n- Dashboard and Guides `app.css` token hierarchies.\n- davis9001.dev contextual palettes with dark overrides.\n\n# Example\n```css\n:root {\n  --color-background: #ffffff;\n  --color-surface: #f8f9fa;\n  --color-text: #1a1a1a;\n  --color-primary: #0066cc;\n  --spacing-sm: 0.5rem;\n  --spacing-md: 1rem;\n}\n\n[data-theme="dark"] {\n  --color-background: #0a0a0a;\n  --color-surface: #161b22;\n  --color-text: #f8f9fa;\n  --color-primary: #3b82f6;\n}\n```\n\n# Validation Checklist\n- Theme switch updates all components without per-component edits.\n- Contrast remains WCAG AA across text/background pairs.\n- New components can be built with zero hardcoded color values.\n',
		'difficulty',
		'intermediate',
		'read_time',
		8
	),
	'Theme Token Architecture with CSS Variables',
	'Create scalable light/dark theming with CSS custom properties, semantic tokens, and derived color layers.',
	'Create scalable light/dark theming with CSS custom properties, semantic tokens, and derived color layers.',
	'markdown',
	CURRENT_TIMESTAMP,
	20
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_items
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'theme-token-architecture'
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
	'command-palette-architecture',
	'Command Palette Architecture for Product Teams',
	'published',
	json_object(
		'excerpt',
		'Build command palettes with typed commands, category grouping, and shortcut-first workflows.',
		'body',
		'# Rule\nTreat the command palette as a command runtime, not just a search modal.\n\n# Why\nA typed command model scales from simple navigation to power-user automation.\n\n# Must\n- Define commands with stable IDs, labels, descriptions, categories, and execute handlers.\n- Support keyboard open/close shortcuts and arrow-key navigation.\n- Resolve `Enter` against current selection with deterministic behavior.\n- Keep query parsing pure and testable.\n\n# Should\n- Support prefix shortcuts (`g query`, `am query`) for high-frequency actions.\n- Group commands by category (`search`, `theme`, `navigation`, `custom`).\n\n# Source Patterns\n- Dashboard command store and command palette component.\n- Guides global command palette trigger and layout integration.\n\n# Command Shape\n```ts\ninterface Command {\n  id: string;\n  name: string;\n  description: string;\n  shortcut?: string;\n  category: "search" | "theme" | "navigation" | "custom";\n  execute: (query?: string) => void;\n}\n```\n\n# Validation Checklist\n- `Cmd/Ctrl+K` and `Cmd/Ctrl+Shift+P` open the palette.\n- Arrow keys cycle predictably.\n- Escape clears input first, then closes on second press.\n- Search shortcuts with payload execute exactly once.\n',
		'difficulty',
		'advanced',
		'read_time',
		9
	),
	'Command Palette Architecture for Product Teams',
	'Design a maintainable command palette with typed commands, category modeling, and shortcut-driven execution.',
	'Design a maintainable command palette with typed commands, category modeling, and shortcut-driven execution.',
	'markdown',
	CURRENT_TIMESTAMP,
	30
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_items
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'command-palette-architecture'
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
	'keyboard-shortcuts-cross-platform',
	'Cross-Platform Keyboard Shortcuts in SvelteKit',
	'published',
	json_object(
		'excerpt',
		'Detect Cmd and Ctrl paths through one utility and register global shortcuts safely in layout scope.',
		'body',
		'# Rule\nBuild keyboard shortcut logic as platform-aware utilities plus lifecycle-safe listeners.\n\n# Why\nShortcuts fail silently when tied to one OS, leaked listeners, or mixed responsibilities.\n\n# Must\n- Detect modifiers with `metaKey || ctrlKey`.\n- Normalize key checks using lowercase comparisons.\n- Register listeners inside `onMount` and remove them on cleanup.\n- Prevent default browser actions for reserved keys you intentionally override.\n\n# Should\n- Keep shortcut predicate logic in isolated utility functions for tests.\n- Avoid shortcut handling when focus is in sensitive text-entry contexts unless explicit.\n\n# Source Patterns\n- Guides `layout-client.ts` and `+layout.svelte` command palette shortcut handling.\n- Dashboard keydown handling in command palette internals.\n\n# Utility Example\n```ts\nexport function shouldToggleCommandPaletteShortcut(event: {\n  metaKey: boolean;\n  ctrlKey: boolean;\n  shiftKey: boolean;\n  key: string;\n}) {\n  const modifier = event.metaKey || event.ctrlKey;\n  const key = event.key.toLowerCase();\n  return modifier && (key === "k" || (event.shiftKey && key === "p"));\n}\n```\n\n# Validation Checklist\n- Works on macOS and Linux/Windows.\n- No duplicate handlers after route changes.\n- Shortcut conflicts with browser defaults are resolved intentionally.\n',
		'difficulty',
		'intermediate',
		'read_time',
		6
	),
	'Cross-Platform Keyboard Shortcuts in SvelteKit',
	'Implement reliable keyboard shortcut handling across macOS, Linux, and Windows with lifecycle-safe listeners.',
	'Implement reliable keyboard shortcut handling across macOS, Linux, and Windows with lifecycle-safe listeners.',
	'markdown',
	CURRENT_TIMESTAMP,
	40
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_items
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'keyboard-shortcuts-cross-platform'
	);

-- Attach tags to seeded guides.
INSERT INTO content_item_tags (content_item_id, content_tag_id)
SELECT ci.id, ct.id
FROM content_items ci
JOIN content_tags ct ON ct.content_type_id = ci.content_type_id
WHERE ci.slug = 'theme-mode-resolution'
	AND ct.slug IN ('theming', 'dark-mode')
	AND NOT EXISTS (
		SELECT 1 FROM content_item_tags x
		WHERE x.content_item_id = ci.id
			AND x.content_tag_id = ct.id
	);

INSERT INTO content_item_tags (content_item_id, content_tag_id)
SELECT ci.id, ct.id
FROM content_items ci
JOIN content_tags ct ON ct.content_type_id = ci.content_type_id
WHERE ci.slug = 'theme-token-architecture'
	AND ct.slug IN ('theming', 'dark-mode')
	AND NOT EXISTS (
		SELECT 1 FROM content_item_tags x
		WHERE x.content_item_id = ci.id
			AND x.content_tag_id = ct.id
	);

INSERT INTO content_item_tags (content_item_id, content_tag_id)
SELECT ci.id, ct.id
FROM content_items ci
JOIN content_tags ct ON ct.content_type_id = ci.content_type_id
WHERE ci.slug = 'command-palette-architecture'
	AND ct.slug IN ('command-palette', 'keyboard-shortcuts')
	AND NOT EXISTS (
		SELECT 1 FROM content_item_tags x
		WHERE x.content_item_id = ci.id
			AND x.content_tag_id = ct.id
	);

INSERT INTO content_item_tags (content_item_id, content_tag_id)
SELECT ci.id, ct.id
FROM content_items ci
JOIN content_tags ct ON ct.content_type_id = ci.content_type_id
WHERE ci.slug = 'keyboard-shortcuts-cross-platform'
	AND ct.slug IN ('keyboard-shortcuts', 'command-palette')
	AND NOT EXISTS (
		SELECT 1 FROM content_item_tags x
		WHERE x.content_item_id = ci.id
			AND x.content_tag_id = ct.id
	);
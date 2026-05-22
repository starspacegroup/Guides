-- Deepen UI guide seed content into implementation playbooks.
-- This migration updates existing seeded guides and adds advanced companion guides.

-- Extend taxonomy for long-term curation.
INSERT INTO content_tags (id, content_type_id, name, slug)
SELECT
	lower(hex(randomblob(16))),
	(SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1),
	'Accessibility',
	'accessibility'
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_tags
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'accessibility'
	);

INSERT INTO content_tags (id, content_type_id, name, slug)
SELECT
	lower(hex(randomblob(16))),
	(SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1),
	'Testing',
	'testing'
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_tags
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'testing'
	);

INSERT INTO content_tags (id, content_type_id, name, slug)
SELECT
	lower(hex(randomblob(16))),
	(SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1),
	'Architecture',
	'architecture'
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_tags
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'architecture'
	);

-- Upgrade: Theme mode resolution guide (deep architecture playbook).
UPDATE content_items
SET
	fields = json_set(
		CASE WHEN json_valid(fields) THEN fields ELSE '{}' END,
		'$.excerpt',
		'Build theme mode as an architecture with preference precedence, SSR-safe bootstrapping, cross-tab synchronization, and operational telemetry.',
		'$.body',
		'# Theme Mode Resolution Playbook\n\n## Scope\nThis guide defines a production strategy for light, dark, and system mode behavior across SSR, hydration, client navigation, and multi-tab usage.\n\n## Design Goals\n- No flash between initial paint and hydration.\n- Deterministic precedence across explicit user preference, org defaults, and system preference.\n- Stable behavior across tabs and browser restarts.\n- Platform parity across macOS, Linux, and Windows.\n\n## Decision Model\nDefine three distinct states:\n- preference: `light | dark | system`\n- systemTheme: `light | dark` from media query\n- resolvedTheme: computed output applied to the document\n\nResolution order:\n1. explicit user preference in storage\n2. optional tenant or app default\n3. system preference\n4. fallback to light\n\n## SSR and First Paint Strategy\nUse a tiny inline script in app shell to set `data-theme` before app JS executes.\n\n```html\n<script>\n(() => {\n  try {\n    const pref = localStorage.getItem("theme-preference");\n    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;\n    const resolved = pref === "light" || pref === "dark"\n      ? pref\n      : (systemDark ? "dark" : "light");\n    document.documentElement.setAttribute("data-theme", resolved);\n  } catch (_) {\n    document.documentElement.setAttribute("data-theme", "light");\n  }\n})();\n</script>\n```\n\n## Store Topology\nUse one writable store for preference, one for system state, and one derived store for resolved output.\n\n```ts\ntype ThemePreference = "light" | "dark" | "system";\ntype ResolvedTheme = "light" | "dark";\n\nexport const themePreference = writable<ThemePreference>("system");\nexport const systemTheme = writable<ResolvedTheme>("light");\nexport const resolvedTheme = derived(\n  [themePreference, systemTheme],\n  ([$pref, $sys]) => ($pref === "system" ? $sys : $pref)\n);\n```\n\n## Event Wiring\n- subscribe to media query change events\n- subscribe to `storage` event for cross-tab updates\n- apply resolved theme to `documentElement.dataset.theme`\n- persist preference only when it changes\n\n## Failure Modes and Guards\n- localStorage unavailable: default to system->light fallback\n- stale values in storage: ignore and normalize\n- hydration mismatch: always set pre-hydration data-theme\n- race conditions on startup: compute once, apply once, then subscribe\n\n## Test Matrix\nUnit tests:\n- resolution precedence for all permutations\n- invalid storage value normalization\n- derived store transitions\n\nIntegration tests:\n- startup with no preference follows system\n- toggling preference persists and applies\n- changing OS theme updates app in system mode\n\nE2E tests:\n- no flash on first paint in both themes\n- cross-tab sync after preference change\n\n## Telemetry\nRecord:\n- theme_preference_changed\n- theme_resolved\n- theme_source_used (user, tenant, system, fallback)\n\n## Rollout Plan\n1. ship read-only telemetry first\n2. ship preference persistence\n3. ship system listener and cross-tab sync\n4. monitor mismatch rate and regressions\n\n## Anti-patterns\n- using one boolean for dark mode and no system state\n- applying class after hydration only\n- coupling icon rendering directly to raw storage value\n',
		'$.difficulty',
		'advanced',
		'$.read_time',
		14
	),
	summary = 'Production playbook for resilient light/dark/system mode including SSR initialization, precedence rules, cross-tab sync, and telemetry.',
	seo_description = 'Production playbook for resilient light/dark/system mode including SSR initialization, precedence rules, cross-tab sync, and telemetry.',
	updated_at = CURRENT_TIMESTAMP
WHERE slug = 'theme-mode-resolution'
	AND content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1);

-- Upgrade: Theme token architecture guide (deep governance + implementation).
UPDATE content_items
SET
	fields = json_set(
		CASE WHEN json_valid(fields) THEN fields ELSE '{}' END,
		'$.excerpt',
		'Implement tokens as a governed design API with semantic layers, dark overrides, contrast gates, and migration-safe naming conventions.',
		'$.body',
		'# Theme Token Architecture Playbook\n\n## Scope\nThis guide turns CSS variables into a long-term contract for components, teams, and product surfaces.\n\n## Token Layers\nUse three layers:\n1. primitive tokens (raw palette and spacing values)\n2. semantic tokens (surface, text, border, accent, success)\n3. component tokens (optional per-component aliases)\n\n## Naming Rules\n- stable prefixes: `--color-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--transition-*`\n- avoid intent-less names such as `--blue-1` in component code\n- component files consume semantic tokens only\n\n## Theme Model\nDefine light defaults in `:root` and dark overrides in `[data-theme="dark"]`.\n\n```css\n:root {\n  --color-bg: #ffffff;\n  --color-surface: #f8f9fa;\n  --color-text: #1a1a1a;\n  --color-border: #d1d5db;\n  --color-primary: #0066cc;\n}\n\n[data-theme="dark"] {\n  --color-bg: #0a0a0a;\n  --color-surface: #161b22;\n  --color-text: #f3f4f6;\n  --color-border: #374151;\n  --color-primary: #3b82f6;\n}\n```\n\n## Derived Values\nUse `color-mix()` for hover, focus, and subtle gradients. This keeps derivatives linked to core semantic tokens.\n\n## Accessibility Contract\n- all text combinations must pass WCAG AA\n- maintain explicit tokens for text on accent and text on warning\n- keep disabled states distinct from muted states\n\n## Token Governance\nCreate a change policy:\n- add before rename\n- deprecate with comment and migration ticket\n- remove only after usage count reaches zero\n\n## Migration Strategy\nWhen replacing token names:\n1. add new token aliases\n2. update components gradually\n3. run contrast validation\n4. remove deprecated aliases in a later release\n\n## Testing Strategy\nUnit:\n- token parser and fallback logic\n\nIntegration:\n- critical components snapshot in light and dark themes\n- contrast checks over core semantic pairs\n\nRegression:\n- check that no component style introduces hardcoded colors\n\n## Operational Checks\n- monitor contrast validator in CI\n- monitor token growth to avoid uncontrolled sprawl\n- maintain token docs with examples and intended usage\n\n## Anti-patterns\n- hardcoding color values in component files\n- making dark theme a separate stylesheet with duplicated rules\n- encoding business meaning into primitive token names\n',
		'$.difficulty',
		'advanced',
		'$.read_time',
		16
	),
	summary = 'Deep token governance guide covering layer strategy, accessibility gates, migration policy, and CI validation for scalable theming.',
	seo_description = 'Deep token governance guide covering layer strategy, accessibility gates, migration policy, and CI validation for scalable theming.',
	updated_at = CURRENT_TIMESTAMP
WHERE slug = 'theme-token-architecture'
	AND content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1);

-- Upgrade: Command palette architecture guide (runtime + ranking + safety).
UPDATE content_items
SET
	fields = json_set(
		CASE WHEN json_valid(fields) THEN fields ELSE '{}' END,
		'$.excerpt',
		'Design command palettes as a command runtime with ranking, intent parsing, access policy, and deterministic execution semantics.',
		'$.body',
		'# Command Palette Architecture Playbook\n\n## Scope\nThis guide defines a scalable command system for navigation, search, and product operations.\n\n## Command Model\nEach command should include:\n- id: immutable stable identifier\n- name: display label\n- description: searchable helper text\n- category: search, theme, navigation, custom\n- shortcut: optional typed prefix\n- execute: side-effect handler\n- access: optional permission metadata\n\n## Runtime Stages\n1. collect commands from providers\n2. filter by permissions and context\n3. parse query intent\n4. rank candidates\n5. render list and allow keyboard navigation\n6. execute selected command with payload\n\n## Query Parsing\nSupport two modes:\n- free text fuzzy search\n- prefix mode such as `g hello`\n\nKeep parser pure and separately tested.\n\n## Ranking Heuristics\nWeighted score example:\n- exact name match: 100\n- prefix shortcut exact: 95\n- startsWith name: 80\n- includes in description: 40\n- recent usage bonus: +10\n\n## Keyboard Semantics\n- Cmd/Ctrl+K and Cmd/Ctrl+Shift+P open\n- ArrowUp and ArrowDown cycle list\n- Enter executes active item\n- Escape clears input first, closes on second press\n\n## Focus and Accessibility\n- trap focus while modal is open\n- announce active command to screen readers\n- preserve visible focus ring on list items\n- keep pointer and keyboard selection in sync\n\n## Execution Safety\n- avoid duplicate execution on key repeat\n- disable execute while async action in flight\n- surface errors in non-blocking toast\n- log command failures with stable ids\n\n## Observability\nTrack:\n- command_palette_opened\n- command_selected\n- command_executed\n- command_failed\n- command_search_latency_ms\n\n## Extensibility Pattern\nAdopt command providers by feature area:\n- theme provider\n- navigation provider\n- external search provider\n\nMerge providers into one array at runtime with deterministic ordering.\n\n## Test Matrix\nUnit:\n- parser and ranking functions\n- keyboard state transitions\n\nIntegration:\n- open/close behavior\n- selection and execute flow\n\nE2E:\n- typed shortcut payload execution\n- accessibility regression checks\n\n## Anti-patterns\n- business logic inside component template\n- hardcoded command arrays without ownership boundaries\n- inconsistent shortcut behavior across platforms\n',
		'$.difficulty',
		'advanced',
		'$.read_time',
		15
	),
	summary = 'Implementation playbook for command palette runtime design including ranking, parsing, accessibility, and operational telemetry.',
	seo_description = 'Implementation playbook for command palette runtime design including ranking, parsing, accessibility, and operational telemetry.',
	updated_at = CURRENT_TIMESTAMP
WHERE slug = 'command-palette-architecture'
	AND content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1);

-- Upgrade: Keyboard shortcuts guide (cross-platform and context rules).
UPDATE content_items
SET
	fields = json_set(
		CASE WHEN json_valid(fields) THEN fields ELSE '{}' END,
		'$.excerpt',
		'Define shortcuts as a platform-neutral contract with context awareness, conflict management, and strict lifecycle cleanup.',
		'$.body',
		'# Cross-Platform Keyboard Shortcuts Playbook\n\n## Scope\nThis guide standardizes keyboard shortcut behavior across browser and OS environments.\n\n## Core Rules\n- detect modifier as `metaKey || ctrlKey`\n- normalize key string to lowercase\n- register listeners in lifecycle hooks only\n- remove listeners on teardown\n\n## Context Gating\nDo not trigger global shortcuts when focus is in:\n- text input\n- textarea\n- contenteditable region\n\nAllow opt-in exceptions with explicit data attributes.\n\n## Conflict Policy\nDefine reserved combinations:\n- browser critical shortcuts remain untouched\n- product shortcuts must call `preventDefault()` only when intentional\n- add compatibility notes for Firefox and Safari differences\n\n## Suggested Utility\n```ts\nexport function isGlobalShortcutAllowed(target: EventTarget | null): boolean {\n  const el = target as HTMLElement | null;\n  if (!el) return true;\n  const tag = (el.tagName || "").toLowerCase();\n  const editable = el.getAttribute("contenteditable") === "true";\n  return !editable && tag !== "input" && tag !== "textarea";\n}\n```\n\n## Registration Pattern\n- register in top-level layout on mount\n- delegate to feature-specific handlers\n- keep one global listener to prevent duplicates\n\n## QA Matrix\nPlatform:\n- macOS with Cmd modifiers\n- Linux and Windows with Ctrl modifiers\n\nBrowsers:\n- Chromium\n- Firefox\n- WebKit\n\nStates:\n- modal open\n- input focused\n- route transitions\n\n## Telemetry\n- shortcut_pressed\n- shortcut_blocked_by_context\n- shortcut_conflict_detected\n\n## Anti-patterns\n- binding listeners in multiple nested components\n- hardcoding one OS behavior\n- executing global actions from inside text input fields\n',
		'$.difficulty',
		'advanced',
		'$.read_time',
		12
	),
	summary = 'Detailed shortcut standard covering platform normalization, context gating, conflict policy, and QA matrix.',
	seo_description = 'Detailed shortcut standard covering platform normalization, context gating, conflict policy, and QA matrix.',
	updated_at = CURRENT_TIMESTAMP
WHERE slug = 'keyboard-shortcuts-cross-platform'
	AND content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1);

-- Add advanced guide: Theme system verification and regression strategy.
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
	'theme-regression-testing-strategy',
	'Theme Regression Testing Strategy',
	'published',
	json_object(
		'excerpt',
		'A complete testing strategy for theme correctness across stores, CSS tokens, accessibility, and first paint behavior.',
		'body',
		'# Theme Regression Testing Strategy\n\n## Scope\nA layered approach to prevent dark and light mode regressions in production.\n\n## Pyramid\n- unit: resolution logic and store behavior\n- integration: layout application and CSS token usage\n- e2e: paint, navigation, and persistence\n\n## Unit Cases\n- preference precedence matrix\n- storage normalization\n- media query listener transitions\n\n## Integration Cases\n- data-theme updates on state changes\n- key screens inherit semantic tokens correctly\n- contrast utility reports no AA violations\n\n## E2E Cases\n- first paint is in resolved theme\n- no flash when navigating between routes\n- multi-tab storage sync works\n\n## Tooling\n- vitest for store and utility tests\n- playwright for visual and behavior checks\n- contrast validator in CI gate\n\n## Release Gate\nDo not ship when:\n- any critical theme test fails\n- contrast checks fail\n- first-paint mismatch detected in smoke tests\n\n## Anti-patterns\n- relying only on manual QA\n- snapshot tests without behavior assertions\n- missing tests for system theme changes\n',
		'difficulty',
		'advanced',
		'read_time',
		11
	),
	'Theme Regression Testing Strategy',
	'Prevent dark and light mode regressions with a layered unit, integration, and end-to-end test strategy.',
	'Prevent dark and light mode regressions with a layered unit, integration, and end-to-end test strategy.',
	'markdown',
	CURRENT_TIMESTAMP,
	50
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_items
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'theme-regression-testing-strategy'
	);

-- Add advanced guide: command palette accessibility and interaction quality.
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
	'command-palette-accessibility-quality',
	'Command Palette Accessibility and Interaction Quality',
	'published',
	json_object(
		'excerpt',
		'Accessibility and interaction quality standards for command palettes, including focus behavior, announcements, and error ergonomics.',
		'body',
		'# Command Palette Accessibility and Interaction Quality\n\n## Scope\nThis guide sets quality bars for accessible command palette interactions.\n\n## Interaction Model\n- open palette and move focus to input\n- keep logical tab order\n- preserve keyboard parity with pointer interactions\n\n## Accessibility Requirements\n- dialog role with proper label\n- listbox semantics for command results\n- active descendant tracking for keyboard selection\n- announced result count updates\n\n## Focus Behavior\n- return focus to trigger element when palette closes\n- avoid focus loss on rerender\n- ensure Escape closes predictably\n\n## Empty and Error States\n- no results state with actionable guidance\n- async failure state with retry path\n- non-blocking toast for command execution failures\n\n## Performance Targets\n- search to first result under 50ms for normal command sets\n- keyboard navigation without dropped frames\n\n## Testing\nUnit:\n- keyboard transition logic\n- empty-state predicate\n\nIntegration:\n- role attributes and aria relationships\n- focus return and active selection semantics\n\nE2E:\n- full keyboard-only flow\n- screen reader announcement verification\n\n## Anti-patterns\n- trapping focus without Escape exit path\n- using visual selection without aria active state\n- missing error pathway for failed commands\n',
		'difficulty',
		'advanced',
		'read_time',
		10
	),
	'Command Palette Accessibility and Interaction Quality',
	'Accessibility and interaction quality standards for command palettes with focus, semantics, error states, and performance targets.',
	'Accessibility and interaction quality standards for command palettes with focus, semantics, error states, and performance targets.',
	'markdown',
	CURRENT_TIMESTAMP,
	60
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')
	AND NOT EXISTS (
		SELECT 1 FROM content_items
		WHERE content_type_id = (SELECT id FROM content_types WHERE slug = 'user-interface' LIMIT 1)
			AND slug = 'command-palette-accessibility-quality'
	);

-- Refresh tag mappings for upgraded and new guides.
INSERT INTO content_item_tags (content_item_id, content_tag_id)
SELECT ci.id, ct.id
FROM content_items ci
JOIN content_tags ct ON ct.content_type_id = ci.content_type_id
WHERE ci.slug = 'theme-mode-resolution'
	AND ct.slug IN ('theming', 'dark-mode', 'architecture')
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
	AND ct.slug IN ('theming', 'dark-mode', 'architecture')
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
	AND ct.slug IN ('command-palette', 'keyboard-shortcuts', 'architecture')
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
	AND ct.slug IN ('keyboard-shortcuts', 'command-palette', 'architecture')
	AND NOT EXISTS (
		SELECT 1 FROM content_item_tags x
		WHERE x.content_item_id = ci.id
			AND x.content_tag_id = ct.id
	);

INSERT INTO content_item_tags (content_item_id, content_tag_id)
SELECT ci.id, ct.id
FROM content_items ci
JOIN content_tags ct ON ct.content_type_id = ci.content_type_id
WHERE ci.slug = 'theme-regression-testing-strategy'
	AND ct.slug IN ('theming', 'dark-mode', 'testing')
	AND NOT EXISTS (
		SELECT 1 FROM content_item_tags x
		WHERE x.content_item_id = ci.id
			AND x.content_tag_id = ct.id
	);

INSERT INTO content_item_tags (content_item_id, content_tag_id)
SELECT ci.id, ct.id
FROM content_items ci
JOIN content_tags ct ON ct.content_type_id = ci.content_type_id
WHERE ci.slug = 'command-palette-accessibility-quality'
	AND ct.slug IN ('command-palette', 'keyboard-shortcuts', 'accessibility', 'testing')
	AND NOT EXISTS (
		SELECT 1 FROM content_item_tags x
		WHERE x.content_item_id = ci.id
			AND x.content_tag_id = ct.id
	);
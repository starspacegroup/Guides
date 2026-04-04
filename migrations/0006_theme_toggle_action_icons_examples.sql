-- Add practical code examples to the existing UI patterns guide.

UPDATE content_items
SET
	fields = json_set(
		CASE
			WHEN json_valid(fields) THEN fields
			ELSE '{}'
		END,
		'$.excerpt',
		'Theme toggle buttons should show the icon for the theme the user will switch to, not the current theme status, and the guide should show how to implement that clearly.',
		'$.body',
		'# Rule
Theme toggle icons must indicate the next action.

# Why
Users click buttons to cause an outcome. The icon should preview that outcome, not duplicate current status.

# Must
- Show a moon icon while the site is in light mode.
- Show a sun icon while the site is in dark mode.
- Use an accessible label that announces the action, such as "Switch to dark mode".
- Persist the chosen theme across reloads.

# Should
- Respect system theme before a user preference exists.
- Animate the icon transition lightly without delaying the theme change.

# Code Examples
## Svelte
```svelte
<script lang="ts">
	type Theme = "light" | "dark";

	let currentTheme: Theme = "light";

	function applyTheme(nextTheme: Theme) {
		currentTheme = nextTheme;
		document.documentElement.dataset.theme = nextTheme;
		localStorage.setItem("theme-preference", nextTheme);
	}

	function toggleTheme() {
		applyTheme(currentTheme === "light" ? "dark" : "light");
	}

	$: nextTheme = currentTheme === "light" ? "dark" : "light";
	$: actionLabel = `Switch to ${nextTheme} mode`;
</script>

<button
	type="button"
	on:click={toggleTheme}
	aria-label={actionLabel}
	title={actionLabel}
>
	{#if nextTheme === "dark"}
		<MoonIcon />
	{:else}
		<SunIcon />
	{/if}
</button>
```

Use the next theme for both the icon and the label. The button tells the user what will happen before they click.

## DOM and TypeScript
```ts
type Theme = "light" | "dark";

const button = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
const root = document.documentElement;

function resolveTheme(): Theme {
	const saved = localStorage.getItem("theme-preference");
	if (saved === "light" || saved === "dark") {
		return saved;
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function render(currentTheme: Theme) {
	const nextTheme = currentTheme === "light" ? "dark" : "light";
	const actionLabel = `Switch to ${nextTheme} mode`;

	button?.setAttribute("aria-label", actionLabel);
	button?.setAttribute("title", actionLabel);
	button?.setAttribute("data-icon", nextTheme === "dark" ? "moon" : "sun");
}

let currentTheme = resolveTheme();
root.dataset.theme = currentTheme;
render(currentTheme);

button?.addEventListener("click", () => {
	currentTheme = currentTheme === "light" ? "dark" : "light";
	root.dataset.theme = currentTheme;
	localStorage.setItem("theme-preference", currentTheme);
	render(currentTheme);
});
```

This version keeps the label, persisted preference, and displayed icon in sync with the next action.

# Anti-patterns
- Using the moon icon as a dark-mode status badge.
- Showing the same icon regardless of current theme.
- Updating the visual state but leaving the accessible label stale.

# Test Cases
- Keyboard activation works with Enter and Space.
- Screen readers hear the correct action label before and after toggle.
- The saved preference is restored on reload.
- The initial icon follows the resolved system theme when no preference exists.

# Telemetry
- theme_toggle_clicked
- theme_changed
- theme_preference_source',
		'$.read_time',
		8
	),
	seo_description = 'Theme toggle buttons should show the icon for the theme the user will switch to, not the current theme status, with implementation examples.',
	summary = 'Theme toggle buttons should show the icon for the theme the user will switch to, not the current theme status, with implementation examples.',
	updated_at = CURRENT_TIMESTAMP
WHERE slug = 'theme-toggle-action-icons'
	AND content_type_id IN (SELECT id FROM content_types WHERE slug = 'ui-patterns');
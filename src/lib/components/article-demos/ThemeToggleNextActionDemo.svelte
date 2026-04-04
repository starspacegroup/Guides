<script lang="ts">
	type PreviewTheme = 'light' | 'dark';

	let currentTheme: PreviewTheme = 'light';

	function buildPreviewStyle(theme: PreviewTheme) {
		const prefix = `--color-demo-theme-toggle-${theme}`;

		return [
			`--demo-frame-background: var(${prefix}-frame-background)`,
			`--demo-frame-border: var(${prefix}-frame-border)`,
			`--demo-surface-top: var(${prefix}-surface-top)`,
			`--demo-surface-bottom: var(${prefix}-surface-bottom)`,
			`--demo-button-background: var(${prefix}-button-background)`,
			`--demo-button-border: var(${prefix}-button-border)`,
			`--demo-button-highlight: var(${prefix}-button-highlight)`,
			`--demo-button-glow: var(${prefix}-button-glow)`,
			`--demo-icon-background: var(${prefix}-icon-background)`,
			`--demo-icon-foreground: var(${prefix}-icon-foreground)`,
			`--demo-icon-shadow: var(${prefix}-icon-shadow)`
		].join('; ');
	}

	$: nextTheme = (currentTheme === 'light' ? 'dark' : 'light') as PreviewTheme;
	$: actionLabel = `Switch to ${nextTheme} mode`;
	$: previewStyle = buildPreviewStyle(currentTheme);

	function toggleTheme() {
		currentTheme = nextTheme;
	}
</script>

<section
	class="theme-toggle-next-action-demo"
	data-header-demo="theme-toggle-next-action"
	data-preview-theme={currentTheme}
	style={previewStyle}
	aria-label="Working theme toggle example"
>
	<div class="theme-toggle-next-action-demo__frame">
		<div class="theme-toggle-next-action-demo__surface">
			<button
				type="button"
				class="theme-toggle-next-action-demo__button"
				data-current-theme={currentTheme}
				data-next-theme={nextTheme}
				on:click={toggleTheme}
				aria-label={actionLabel}
				title={actionLabel}
			>
				<span class="theme-toggle-next-action-demo__button-ring" aria-hidden="true"></span>
				<span class="theme-toggle-next-action-demo__button-glow" aria-hidden="true"></span>
				<span class="theme-toggle-next-action-demo__icon" aria-hidden="true">
					{#if nextTheme === 'dark'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
						</svg>
					{:else}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="4.5"></circle>
							<line x1="12" y1="1.5" x2="12" y2="4"></line>
							<line x1="12" y1="20" x2="12" y2="22.5"></line>
							<line x1="4.22" y1="4.22" x2="5.99" y2="5.99"></line>
							<line x1="18.01" y1="18.01" x2="19.78" y2="19.78"></line>
							<line x1="1.5" y1="12" x2="4" y2="12"></line>
							<line x1="20" y1="12" x2="22.5" y2="12"></line>
							<line x1="4.22" y1="19.78" x2="5.99" y2="18.01"></line>
							<line x1="18.01" y1="5.99" x2="19.78" y2="4.22"></line>
						</svg>
					{/if}
				</span>
			</button>
		</div>
	</div>
</section>

<style>
	.theme-toggle-next-action-demo {
		position: relative;
		z-index: 1;
	}

	.theme-toggle-next-action-demo__frame {
		padding: clamp(var(--spacing-sm), 2vw, var(--spacing-md));
		border: 1px solid var(--demo-frame-border);
		border-radius: 1.35rem;
		background: var(--demo-frame-background);
		backdrop-filter: blur(12px);
		box-shadow: var(--shadow-md);
	}

	.theme-toggle-next-action-demo__surface {
		padding: var(--spacing-sm);
		border-radius: 1.15rem;
		border: 1px solid var(--demo-frame-border);
		display: flex;
		justify-content: center;
		align-items: center;
		background:
			linear-gradient(
				180deg,
				var(--demo-surface-top) 0%,
				var(--demo-surface-bottom) 100%
			),
			var(--demo-surface-bottom);
	}

	.theme-toggle-next-action-demo__button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 4.75rem;
		height: 4.75rem;
		padding: 0;
		border-radius: 999px;
		border: 1px solid var(--demo-button-border);
		background:
			radial-gradient(circle at 30% 30%, var(--demo-button-highlight) 0%, transparent 46%),
			var(--demo-button-background);
		color: var(--demo-icon-foreground);
		cursor: pointer;
		transition:
			transform var(--transition-fast),
			background-color var(--transition-fast),
			border-color var(--transition-fast),
			box-shadow var(--transition-fast);
	}

	.theme-toggle-next-action-demo__button-ring {
		position: absolute;
		inset: 0.28rem;
		border-radius: 999px;
		border: 1px solid var(--demo-frame-border);
		pointer-events: none;
	}

	.theme-toggle-next-action-demo__button-glow {
		position: relative;
		z-index: 0;
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: 999px;
		background: radial-gradient(circle, var(--demo-button-glow) 0%, transparent 70%);
		filter: blur(10px);
		opacity: 0.9;
		pointer-events: none;
	}

	.theme-toggle-next-action-demo__icon {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.7rem;
		height: 2.7rem;
		border-radius: 999px;
		background: var(--demo-icon-background);
		box-shadow: 0 0.8rem 1.4rem var(--demo-icon-shadow);
		color: var(--demo-icon-foreground);
		transition:
			background-color var(--transition-fast),
			box-shadow var(--transition-fast),
			color var(--transition-fast),
			transform var(--transition-fast);
	}

	.theme-toggle-next-action-demo__icon svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.theme-toggle-next-action-demo__button:hover {
		transform: translateY(-1px);
		border-color: var(--demo-button-border);
		box-shadow: 0 0 0 0.2rem var(--demo-button-glow);
	}

	.theme-toggle-next-action-demo__button:hover .theme-toggle-next-action-demo__icon {
		transform: scale(1.04);
	}

	.theme-toggle-next-action-demo__button:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
<script lang="ts">
	type PreviewTheme = 'light' | 'dark';

	let currentTheme: PreviewTheme = 'light';

	$: nextTheme = (currentTheme === 'light' ? 'dark' : 'light') as PreviewTheme;
	$: actionLabel = `Switch to ${nextTheme} mode`;

	function toggleTheme() {
		currentTheme = nextTheme;
	}
</script>

<section
	class="theme-toggle-next-action-demo"
	data-header-demo="theme-toggle-next-action"
	data-preview-theme={currentTheme}
	aria-label="Working theme toggle example"
>
	<div class="theme-toggle-next-action-demo__frame">
		<div class="theme-toggle-next-action-demo__surface">
			<button
				type="button"
				class="theme-toggle-next-action-demo__button"
				data-current-theme={currentTheme}
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
		border: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--color-background));
		border-radius: 1.35rem;
		background: color-mix(in srgb, var(--color-surface) 88%, var(--color-background));
		backdrop-filter: blur(12px);
		box-shadow: var(--shadow-md);
	}

	.theme-toggle-next-action-demo__surface {
		padding: var(--spacing-sm);
		border-radius: 1.15rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 86%, var(--color-background));
		display: flex;
		justify-content: center;
		align-items: center;
		background:
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--color-surface) 92%, var(--color-background)) 0%,
				color-mix(in srgb, var(--color-background) 94%, var(--color-surface)) 100%
			),
			var(--color-background);
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
		border: 1px solid color-mix(in srgb, var(--color-primary) 34%, var(--color-border));
		background:
			radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--color-background) 62%, transparent) 0%, transparent 46%),
			color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
		color: var(--color-text);
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
		border: 1px solid color-mix(in srgb, var(--color-background) 18%, var(--color-border));
		pointer-events: none;
	}

	.theme-toggle-next-action-demo__button-glow {
		position: relative;
		z-index: 0;
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: 999px;
		background: radial-gradient(circle, color-mix(in srgb, var(--color-primary) 24%, transparent) 0%, transparent 70%);
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
		background: color-mix(in srgb, var(--color-background) 80%, var(--color-surface));
		box-shadow:
			0 0.8rem 1.4rem color-mix(in srgb, var(--color-primary) 16%, transparent),
			inset 0 1px 0 color-mix(in srgb, var(--color-background) 28%, transparent);
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
		border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
		box-shadow: 0 0 0 0.2rem color-mix(in srgb, var(--color-primary) 14%, transparent);
	}

	.theme-toggle-next-action-demo__button:hover .theme-toggle-next-action-demo__icon {
		transform: scale(1.04);
	}

	.theme-toggle-next-action-demo__button:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.theme-toggle-next-action-demo__button[data-current-theme='light'] .theme-toggle-next-action-demo__icon {
		color: color-mix(in srgb, var(--color-secondary) 68%, var(--color-text));
	}

	.theme-toggle-next-action-demo[data-preview-theme='dark'] .theme-toggle-next-action-demo__surface {
		background:
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--color-text) 18%, var(--color-surface)) 0%,
				color-mix(in srgb, var(--color-background) 90%, var(--color-surface)) 100%
			),
			var(--color-background);
	}

	.theme-toggle-next-action-demo[data-preview-theme='dark'] .theme-toggle-next-action-demo__button {
		background:
			radial-gradient(circle at 68% 32%, color-mix(in srgb, var(--color-background) 12%, transparent) 0%, transparent 34%),
			color-mix(in srgb, var(--color-secondary) 22%, var(--color-surface));
		border-color: color-mix(in srgb, var(--color-secondary) 34%, var(--color-border));
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-secondary) 18%, transparent);
	}

	.theme-toggle-next-action-demo[data-preview-theme='dark'] .theme-toggle-next-action-demo__button-glow {
		background: radial-gradient(circle, color-mix(in srgb, var(--color-secondary) 28%, transparent) 0%, transparent 72%);
	}

	.theme-toggle-next-action-demo[data-preview-theme='dark'] .theme-toggle-next-action-demo__icon {
		background: color-mix(in srgb, var(--color-text) 16%, var(--color-surface));
		color: color-mix(in srgb, var(--color-primary) 75%, var(--color-surface));
		box-shadow:
			0 0.75rem 1.5rem color-mix(in srgb, var(--color-secondary) 22%, transparent),
			inset 0 1px 0 color-mix(in srgb, var(--color-background) 18%, transparent);
	}
</style>
<script lang="ts">
	type PreviewTheme = 'light' | 'dark';

	let currentTheme: PreviewTheme = 'light';

	$: nextTheme = (currentTheme === 'light' ? 'dark' : 'light') as PreviewTheme;
	$: actionLabel = `Switch to ${nextTheme} mode`;
	$: currentThemeLabel = currentTheme === 'light' ? 'Light' : 'Dark';
	$: nextThemeLabel = nextTheme === 'light' ? 'Light' : 'Dark';

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
		<div class="theme-toggle-next-action-demo__topline">
			<p class="theme-toggle-next-action-demo__eyebrow">Working component</p>
			<div class="theme-toggle-next-action-demo__state-pills" aria-live="polite">
				<span class="theme-toggle-next-action-demo__state-pill">
					<span>Current theme</span>
					<strong>{currentThemeLabel}</strong>
				</span>
				<span class="theme-toggle-next-action-demo__state-pill theme-toggle-next-action-demo__state-pill--accent">
					<span>Icon shows</span>
					<strong>{nextThemeLabel}</strong>
				</span>
			</div>
		</div>

		<div class="theme-toggle-next-action-demo__surface">
			<div class="theme-toggle-next-action-demo__mock-window" aria-hidden="true">
				<span></span>
				<span></span>
				<span></span>
			</div>

			<div class="theme-toggle-next-action-demo__content">
				<div class="theme-toggle-next-action-demo__copy">
					<p class="theme-toggle-next-action-demo__title">The icon previews the result before the click.</p>
					<p class="theme-toggle-next-action-demo__body">
						The button updates its icon and accessible label to match the next theme.
					</p>
				</div>

				<button
					type="button"
					class="theme-toggle-next-action-demo__button"
					on:click={toggleTheme}
					aria-label={actionLabel}
					title={actionLabel}
				>
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
					<span class="theme-toggle-next-action-demo__button-copy">{actionLabel}</span>
				</button>
			</div>
		</div>
	</div>
</section>

<style>
	.theme-toggle-next-action-demo {
		position: relative;
		z-index: 1;
	}

	.theme-toggle-next-action-demo__frame {
		display: grid;
		gap: var(--spacing-sm);
		padding: clamp(var(--spacing-sm), 2vw, var(--spacing-md));
		border: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--color-background));
		border-radius: 1.35rem;
		background: color-mix(in srgb, var(--color-surface) 88%, var(--color-background));
		backdrop-filter: blur(12px);
		box-shadow: var(--shadow-md);
	}

	.theme-toggle-next-action-demo__topline {
		display: grid;
		gap: var(--spacing-xs);
	}

	.theme-toggle-next-action-demo__eyebrow {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.theme-toggle-next-action-demo__state-pills {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.theme-toggle-next-action-demo__state-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.45rem 0.72rem;
		border-radius: 999px;
		font-size: 0.74rem;
		background: color-mix(in srgb, var(--color-background) 72%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-border) 88%, var(--color-background));
		color: var(--color-text-secondary);
	}

	.theme-toggle-next-action-demo__state-pill strong {
		font-size: 0.78rem;
		color: var(--color-text);
	}

	.theme-toggle-next-action-demo__state-pill--accent {
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		border-color: color-mix(in srgb, var(--color-primary) 26%, var(--color-border));
	}

	.theme-toggle-next-action-demo__surface {
		display: grid;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		border-radius: 1.15rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 86%, var(--color-background));
		background:
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--color-surface) 92%, var(--color-background)) 0%,
				color-mix(in srgb, var(--color-background) 94%, var(--color-surface)) 100%
			),
			var(--color-background);
	}

	.theme-toggle-next-action-demo__mock-window {
		display: flex;
		gap: 0.35rem;
	}

	.theme-toggle-next-action-demo__mock-window span {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: color-mix(in srgb, var(--color-text-secondary) 28%, var(--color-surface));
	}

	.theme-toggle-next-action-demo__content {
		display: grid;
		gap: var(--spacing-md);
	}

	.theme-toggle-next-action-demo__copy {
		display: grid;
		gap: 0.45rem;
	}

	.theme-toggle-next-action-demo__title {
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.35;
		color: var(--color-text);
	}

	.theme-toggle-next-action-demo__body {
		font-size: 0.88rem;
		line-height: 1.55;
		color: var(--color-text-secondary);
	}

	.theme-toggle-next-action-demo__button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.7rem;
		width: 100%;
		padding: 0.9rem 1rem;
		border-radius: 1rem;
		border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
		color: var(--color-text);
		cursor: pointer;
		transition:
			transform var(--transition-fast),
			background-color var(--transition-fast),
			border-color var(--transition-fast);
	}

	.theme-toggle-next-action-demo__button:hover {
		transform: translateY(-1px);
		background: color-mix(in srgb, var(--color-primary) 24%, var(--color-surface));
		border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
	}

	.theme-toggle-next-action-demo__button:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.theme-toggle-next-action-demo__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-background) 70%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-border) 86%, var(--color-background));
		flex-shrink: 0;
	}

	.theme-toggle-next-action-demo__icon svg {
		width: 1.1rem;
		height: 1.1rem;
	}

	.theme-toggle-next-action-demo__button-copy {
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.2;
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
		background: color-mix(in srgb, var(--color-secondary) 18%, var(--color-surface));
		border-color: color-mix(in srgb, var(--color-secondary) 34%, var(--color-border));
	}

	@media (min-width: 720px) {
		.theme-toggle-next-action-demo__content {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
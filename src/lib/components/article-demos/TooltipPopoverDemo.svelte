<script lang="ts">
	let showTooltip = false;
	let showPopover = false;
</script>

<section class="tooltip-popover-demo" data-header-demo="tooltip-vs-popover">
	<div class="tooltip-popover-demo__frame">
		<div class="tooltip-popover-demo__column">
			<p class="tooltip-popover-demo__eyebrow">Tooltip</p>
			<div class="tooltip-popover-demo__anchor">
				<button
					type="button"
					on:mouseenter={() => (showTooltip = true)}
					on:mouseleave={() => (showTooltip = false)}
					on:focus={() => (showTooltip = true)}
					on:blur={() => (showTooltip = false)}
				>
					?
				</button>
				{#if showTooltip}
					<div role="tooltip" class="tooltip-popover-demo__tooltip">One short sentence. No actions.</div>
				{/if}
			</div>
		</div>

		<div class="tooltip-popover-demo__column">
			<p class="tooltip-popover-demo__eyebrow">Popover</p>
			<div class="tooltip-popover-demo__anchor">
				<button type="button" aria-expanded={showPopover} on:click={() => (showPopover = !showPopover)}>
					Formatting
				</button>
				{#if showPopover}
					<div class="tooltip-popover-demo__popover" role="dialog" aria-label="Formatting actions">
						<button type="button">Bold</button>
						<button type="button">Link</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	.tooltip-popover-demo__frame {
		display: grid;
		gap: var(--spacing-sm);
		padding: clamp(var(--spacing-sm), 2vw, var(--spacing-md));
		border: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--color-background));
		border-radius: 1.35rem;
		background: color-mix(in srgb, var(--color-surface) 88%, var(--color-background));
		box-shadow: var(--shadow-md);
	}

	.tooltip-popover-demo__column {
		display: grid;
		gap: 0.6rem;
	}

	.tooltip-popover-demo__eyebrow {
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.tooltip-popover-demo__anchor {
		position: relative;
	}

	.tooltip-popover-demo__anchor > button,
	.tooltip-popover-demo__popover button {
		padding: 0.75rem 0.85rem;
		border-radius: 0.8rem;
		border: 1px solid color-mix(in srgb, var(--color-primary) 24%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		color: var(--color-text);
		cursor: pointer;
	}

	.tooltip-popover-demo__tooltip,
	.tooltip-popover-demo__popover {
		position: absolute;
		top: calc(100% + 0.55rem);
		left: 0;
		padding: 0.75rem 0.85rem;
		border-radius: 0.85rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 84%, var(--color-background));
		background: color-mix(in srgb, var(--color-surface) 94%, var(--color-background));
		box-shadow: var(--shadow-md);
		min-width: 12rem;
		z-index: 2;
	}

	.tooltip-popover-demo__tooltip {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
	}

	.tooltip-popover-demo__popover {
		display: grid;
		gap: 0.45rem;
	}

	@media (min-width: 720px) {
		.tooltip-popover-demo__frame {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
<script lang="ts">
	let unread = 7;

	function markRead() {
		unread = 0;
	}

	function addNotification() {
		unread += 1;
	}

	$: badge = unread > 99 ? '99+' : String(unread);
	$: badgeLabel = unread > 0 ? `${badge} unread notifications` : 'No unread notifications';
</script>

<section class="notification-badge-demo" data-header-demo="notification-badge-behavior">
	<div class="notification-badge-demo__frame">
		<button type="button" class="notification-badge-demo__inbox" aria-label={badgeLabel} on:click={markRead}>
			<span aria-hidden="true">🔔</span>
			<span>Inbox</span>
			{#if unread > 0}
				<span class="notification-badge-demo__badge" aria-hidden="true">{badge}</span>
			{/if}
		</button>

		<div class="notification-badge-demo__actions">
			<button type="button" on:click={markRead}>Mark all read</button>
			<button type="button" on:click={addNotification}>Simulate alert</button>
		</div>
	</div>
</section>

<style>
	.notification-badge-demo__frame {
		display: grid;
		gap: var(--spacing-sm);
		padding: clamp(var(--spacing-sm), 2vw, var(--spacing-md));
		border: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--color-background));
		border-radius: 1.35rem;
		background: color-mix(in srgb, var(--color-surface) 88%, var(--color-background));
		box-shadow: var(--shadow-md);
	}

	.notification-badge-demo__inbox {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.65rem;
		padding: 0.9rem 1rem;
		border-radius: 1rem;
		border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 16%, var(--color-surface));
		color: var(--color-text);
		font-weight: 600;
		cursor: pointer;
	}

	.notification-badge-demo__badge {
		min-width: 1.8rem;
		padding: 0.22rem 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-secondary) 26%, var(--color-surface));
		color: var(--color-text);
		font-size: 0.75rem;
	}

	.notification-badge-demo__actions {
		display: flex;
		gap: 0.6rem;
	}

	.notification-badge-demo__actions button {
		flex: 1;
		padding: 0.72rem 0.85rem;
		border-radius: 0.85rem;
		border: 1px solid var(--color-border);
		background: var(--color-background);
		color: var(--color-text);
		cursor: pointer;
	}
</style>
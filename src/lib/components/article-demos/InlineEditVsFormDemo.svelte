<script lang="ts">
	let displayName = 'Mona Geller';
	let draftName = displayName;
	let editingInline = false;
	let fullEditorOpen = false;

	function saveInlineEdit() {
		displayName = draftName.trim() || displayName;
		editingInline = false;
	}
</script>

<section class="inline-edit-demo" data-header-demo="inline-edit-vs-form">
	<div class="inline-edit-demo__frame">
		<div class="inline-edit-demo__card">
			<p class="inline-edit-demo__eyebrow">Inline edit</p>
			{#if editingInline}
				<form class="inline-edit-demo__inline-form" on:submit|preventDefault={saveInlineEdit}>
					<input bind:value={draftName} aria-label="Display name" />
					<div class="inline-edit-demo__actions">
						<button type="submit">Save</button>
						<button type="button" on:click={() => (editingInline = false)}>Cancel</button>
					</div>
				</form>
			{:else}
				<div class="inline-edit-demo__row">
					<div>
						<strong>{displayName}</strong>
						<p>One field. Immediate feedback.</p>
					</div>
					<button type="button" on:click={() => (editingInline = true)}>Edit name</button>
				</div>
			{/if}
		</div>

		<div class="inline-edit-demo__card inline-edit-demo__card--secondary">
			<div class="inline-edit-demo__row inline-edit-demo__row--stack">
				<div>
					<p class="inline-edit-demo__eyebrow">Dedicated form</p>
					<p>Use a full editor when multiple related fields must change together.</p>
				</div>
				<button type="button" on:click={() => (fullEditorOpen = !fullEditorOpen)}>
					{fullEditorOpen ? 'Hide full editor' : 'Open full editor'}
				</button>
			</div>

			{#if fullEditorOpen}
				<div class="inline-edit-demo__full-form">
					<span>Name</span>
					<span>Team</span>
					<span>Role</span>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	.inline-edit-demo__frame {
		display: grid;
		gap: var(--spacing-sm);
		padding: clamp(var(--spacing-sm), 2vw, var(--spacing-md));
		border: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--color-background));
		border-radius: 1.35rem;
		background: color-mix(in srgb, var(--color-surface) 88%, var(--color-background));
		box-shadow: var(--shadow-md);
	}

	.inline-edit-demo__card {
		padding: 0.95rem;
		border-radius: 1rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 84%, var(--color-background));
		background: color-mix(in srgb, var(--color-background) 92%, var(--color-surface));
		display: grid;
		gap: 0.75rem;
	}

	.inline-edit-demo__card--secondary {
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
	}

	.inline-edit-demo__eyebrow {
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.inline-edit-demo__row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}

	.inline-edit-demo__row--stack {
		align-items: start;
	}

	.inline-edit-demo__row p {
		margin-top: 0.25rem;
		font-size: 0.88rem;
		color: var(--color-text-secondary);
	}

	.inline-edit-demo__inline-form,
	.inline-edit-demo__full-form {
		display: grid;
		gap: 0.65rem;
	}

	.inline-edit-demo__inline-form input,
	.inline-edit-demo__full-form span {
		padding: 0.75rem 0.85rem;
		border-radius: 0.8rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.inline-edit-demo__actions,
	.inline-edit-demo__row button {
		display: flex;
		gap: 0.5rem;
	}

	.inline-edit-demo button {
		padding: 0.65rem 0.8rem;
		border-radius: 0.8rem;
		border: 1px solid color-mix(in srgb, var(--color-primary) 26%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 16%, var(--color-surface));
		color: var(--color-text);
		cursor: pointer;
	}
</style>
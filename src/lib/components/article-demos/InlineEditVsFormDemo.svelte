<script lang="ts">
	let displayName = 'Mona Geller';
	let draftName = displayName;
	let profileDraft = {
		name: displayName,
		team: 'Growth Design',
		role: 'Product Designer'
	};
	let editingInline = false;
	let fullEditorOpen = false;

	function saveInlineEdit() {
		displayName = draftName.trim() || displayName;
		editingInline = false;
	}

	function openFullEditor() {
		profileDraft = {
			name: displayName,
			team: profileDraft.team,
			role: profileDraft.role
		};
		fullEditorOpen = true;
	}

	function saveFullEditor() {
		displayName = profileDraft.name.trim() || displayName;
		fullEditorOpen = false;
	}

	function cancelFullEditor() {
		profileDraft = {
			name: displayName,
			team: 'Growth Design',
			role: 'Product Designer'
		};
		fullEditorOpen = false;
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
					<p>Use a full editor when multiple related fields, validation, and confirmation need one save point.</p>
				</div>
				<button type="button" on:click={fullEditorOpen ? cancelFullEditor : openFullEditor}>
					{fullEditorOpen ? 'Hide full editor' : 'Open full editor'}
				</button>
			</div>

			{#if fullEditorOpen}
				<form class="inline-edit-demo__full-form" on:submit|preventDefault={saveFullEditor}>
					<label class="inline-edit-demo__field">
						<span>Name</span>
						<input bind:value={profileDraft.name} aria-label="Name" />
					</label>
					<label class="inline-edit-demo__field">
						<span>Team</span>
						<input bind:value={profileDraft.team} aria-label="Team" />
					</label>
					<label class="inline-edit-demo__field">
						<span>Role</span>
						<input bind:value={profileDraft.role} aria-label="Role" />
					</label>
					<div class="inline-edit-demo__actions">
						<button type="submit">Save profile changes</button>
						<button type="button" on:click={cancelFullEditor}>Cancel form edits</button>
					</div>
				</form>
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

	.inline-edit-demo__field {
		display: grid;
		gap: 0.35rem;
		font-size: 0.85rem;
		color: var(--color-text-secondary);
	}

	.inline-edit-demo__inline-form input,
	.inline-edit-demo__full-form input {
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
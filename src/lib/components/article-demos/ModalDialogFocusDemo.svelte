<script lang="ts">
	import { tick } from 'svelte';

	let isOpen = false;
	let triggerButton: HTMLButtonElement | null = null;
	let closeButton: HTMLButtonElement | null = null;
	let keepEditingButton: HTMLButtonElement | null = null;

	function getFocusableButtons() {
		return [closeButton, keepEditingButton].filter(Boolean) as HTMLButtonElement[];
	}

	async function openDialog() {
		isOpen = true;
		await tick();
		closeButton?.focus();
	}

	function closeDialog() {
		isOpen = false;
		triggerButton?.focus();
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeDialog();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen) {
			return;
		}

		if (event.key === 'Escape') {
			event.preventDefault();
			closeDialog();
			return;
		}

		if (event.key !== 'Tab') {
			return;
		}

		const focusableButtons = getFocusableButtons();
		if (focusableButtons.length === 0) {
			return;
		}

		const first = focusableButtons[0];
		const last = focusableButtons[focusableButtons.length - 1];
		const active = document.activeElement;

		if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}

		if (event.shiftKey && active === first) {
			event.preventDefault();
			last.focus();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<section class="modal-dialog-focus-demo" data-header-demo="modal-dialog-focus-and-close">
	<div class="modal-dialog-focus-demo__frame">
		<div class="modal-dialog-focus-demo__page-preview" aria-hidden="true">
			<div class="modal-dialog-focus-demo__preview-card modal-dialog-focus-demo__preview-card--wide"></div>
			<div class="modal-dialog-focus-demo__preview-row">
				<div class="modal-dialog-focus-demo__preview-card"></div>
				<div class="modal-dialog-focus-demo__preview-card"></div>
			</div>
		</div>

		<button
			bind:this={triggerButton}
			type="button"
			class="modal-dialog-focus-demo__trigger"
			on:click={openDialog}
			aria-haspopup="dialog"
		>
			Open modal example
		</button>

		{#if isOpen}
			<div class="modal-dialog-focus-demo__overlay" role="presentation" on:click={handleOverlayClick}>
				<section
					class="modal-dialog-focus-demo__panel"
					role="dialog"
					aria-modal="true"
					aria-label="Delete project"
				>
					<div class="modal-dialog-focus-demo__header">
						<p class="modal-dialog-focus-demo__eyebrow">Modal example</p>
						<button
							bind:this={closeButton}
							type="button"
							class="modal-dialog-focus-demo__icon-button"
							on:click={closeDialog}
							aria-label="Close dialog"
						>
							×
						</button>
					</div>

					<h3>Delete project</h3>
					<p>Focus moves into the dialog, Escape closes it, and the trigger regains focus.</p>

					<ul class="modal-dialog-focus-demo__checklist">
						<li>Initial focus lands on a close control.</li>
						<li>Tab wraps inside the dialog.</li>
						<li>Backdrop softens the page behind the dialog.</li>
						<li>Dismiss returns focus to the trigger.</li>
					</ul>

					<div class="modal-dialog-focus-demo__actions">
						<button bind:this={keepEditingButton} type="button" class="modal-dialog-focus-demo__secondary" on:click={closeDialog}>
							Keep editing
						</button>
						<button type="button" class="modal-dialog-focus-demo__danger" on:click={closeDialog}>
							Delete draft
						</button>
					</div>
				</section>
			</div>
		{/if}
	</div>
</section>

<style>
	.modal-dialog-focus-demo {
		position: relative;
	}

	.modal-dialog-focus-demo__frame {
		position: relative;
		display: grid;
		gap: var(--spacing-sm);
		padding: clamp(var(--spacing-sm), 2vw, var(--spacing-md));
		border: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--color-background));
		border-radius: 1.35rem;
		background: color-mix(in srgb, var(--color-surface) 88%, var(--color-background));
		box-shadow: var(--shadow-md);
	}

	.modal-dialog-focus-demo__page-preview {
		display: grid;
		gap: 0.6rem;
		padding: 0.35rem;
		border-radius: 1rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 80%, var(--color-background));
		background: color-mix(in srgb, var(--color-background) 94%, var(--color-surface));
	}

	.modal-dialog-focus-demo__preview-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.modal-dialog-focus-demo__preview-card {
		height: 3.6rem;
		border-radius: 0.85rem;
		background:
			linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 18%, var(--color-surface)) 0%, color-mix(in srgb, var(--color-surface) 94%, var(--color-background)) 100%),
			var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-border) 80%, var(--color-background));
	}

	.modal-dialog-focus-demo__preview-card--wide {
		height: 4.5rem;
	}

	.modal-dialog-focus-demo__trigger {
		width: 100%;
		padding: 0.95rem 1rem;
		border-radius: 1rem;
		border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
		color: var(--color-text);
		font-weight: 600;
		cursor: pointer;
	}

	.modal-dialog-focus-demo__overlay {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		padding: clamp(var(--spacing-sm), 4vw, var(--spacing-lg));
		background: color-mix(in srgb, var(--color-background) 58%, transparent);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		z-index: 40;
	}

	.modal-dialog-focus-demo__panel {
		width: min(100%, 23rem);
		padding: 1rem;
		border-radius: 1rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 84%, var(--color-background));
		background: color-mix(in srgb, var(--color-surface) 92%, var(--color-background));
		box-shadow: var(--shadow-lg);
		display: grid;
		gap: 0.75rem;
	}

	.modal-dialog-focus-demo__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-dialog-focus-demo__eyebrow {
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.modal-dialog-focus-demo__icon-button {
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--color-border) 84%, var(--color-background));
		background: var(--color-background);
		color: var(--color-text);
		cursor: pointer;
	}

	.modal-dialog-focus-demo__panel h3 {
		font-size: 1.1rem;
		line-height: 1.2;
	}

	.modal-dialog-focus-demo__panel p,
	.modal-dialog-focus-demo__checklist {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.modal-dialog-focus-demo__checklist {
		margin: 0;
		padding-left: 1rem;
		display: grid;
		gap: 0.35rem;
	}

	.modal-dialog-focus-demo__actions {
		display: flex;
		gap: 0.6rem;
	}

	.modal-dialog-focus-demo__actions button {
		flex: 1;
		padding: 0.75rem 0.85rem;
		border-radius: 0.85rem;
		cursor: pointer;
	}

	.modal-dialog-focus-demo__secondary {
		border: 1px solid var(--color-border);
		background: var(--color-background);
		color: var(--color-text);
	}

	.modal-dialog-focus-demo__danger {
		border: 1px solid color-mix(in srgb, var(--color-secondary) 36%, var(--color-border));
		background: color-mix(in srgb, var(--color-secondary) 16%, var(--color-surface));
		color: var(--color-text);
	}
</style>
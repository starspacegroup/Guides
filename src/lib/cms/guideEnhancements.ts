import type { ContentItemParsed } from '$lib/cms/types';

export const supportedHeaderDemos = [
	'theme-toggle-next-action',
	'modal-dialog-focus-and-close',
	'inline-edit-vs-form',
	'notification-badge-behavior',
	'table-sorting-pagination',
	'tooltip-vs-popover'
] as const;

type HeaderDemo = (typeof supportedHeaderDemos)[number];

interface GuideEnhancement {
	headerDemo: HeaderDemo;
	codeExamples?: string;
}

const codeFence = '```';

const uiPatternEnhancements: Record<string, GuideEnhancement> = {
	'inline-edit-vs-dedicated-form': {
		headerDemo: 'inline-edit-vs-form',
		codeExamples: `# Code Examples
## Svelte

${codeFence}svelte
<script lang="ts">
	let name = 'Morgan Lee';
	let draftName = name;
	let editingInline = false;

	function saveInlineEdit() {
		name = draftName.trim() || name;
		editingInline = false;
	}
</script>

{#if editingInline}
	<form on:submit|preventDefault={saveInlineEdit}>
		<label>
			<span class="sr-only">Display name</span>
			<input bind:value={draftName} />
		</label>
		<button type="submit">Save</button>
		<button type="button" on:click={() => (editingInline = false)}>Cancel</button>
	</form>
{:else}
	<p>{name}</p>
	<button type="button" on:click={() => (editingInline = true)}>Edit name</button>
{/if}

<a href="/profile/edit">Edit full profile</a>
${codeFence}

Use inline editing for a single low-risk field. Switch to a dedicated form when the edit affects multiple fields, validation rules, or confirmation steps.`
	},
	'modal-dialog-focus-and-close-behavior': {
		headerDemo: 'modal-dialog-focus-and-close',
		codeExamples: `# Code Examples
## Svelte

${codeFence}svelte
<script lang="ts">
	import { onDestroy, tick } from 'svelte';

	let open = false;
	let trigger: HTMLButtonElement | null = null;
	let closeButton: HTMLButtonElement | null = null;
	let previousBodyOverflow = '';
	let isBodyScrollLocked = false;

	function lockBodyScroll() {
		if (typeof document === 'undefined' || isBodyScrollLocked) return;

		previousBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		isBodyScrollLocked = true;
	}

	function unlockBodyScroll() {
		if (typeof document === 'undefined' || !isBodyScrollLocked) return;

		document.body.style.overflow = previousBodyOverflow;
		previousBodyOverflow = '';
		isBodyScrollLocked = false;
	}

	async function openDialog() {
		open = true;
		lockBodyScroll();
		await tick();
		closeButton?.focus();
	}

	function closeDialog() {
		open = false;
		unlockBodyScroll();
		trigger?.focus();
	}

	function onBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeDialog();
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (!open) return;
		if (event.key === 'Escape') closeDialog();
	}

	onDestroy(() => {
		unlockBodyScroll();
	});
</script>

<svelte:window on:keydown={onKeydown} />

<button bind:this={trigger} type="button" on:click={openDialog}>Open modal</button>

{#if open}
	<div class="backdrop" on:click={onBackdropClick}>
		<section
			role="dialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
			on:click|stopPropagation
		>
			<h2 id="dialog-title">Delete project</h2>
			<p>Return focus to the trigger when the dialog closes.</p>
			<button bind:this={closeButton} type="button" on:click={closeDialog}>Close</button>
		</section>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgb(15 18 28 / 0.48);
		backdrop-filter: blur(10px);
	}
</style>
${codeFence}

Trap focus inside the dialog, prevent background scrolling, blur the page behind the modal, close when the user clicks the backdrop, support Escape, and always restore focus to the trigger when the dialog closes.`
	},
	'notification-badge-behavior': {
		headerDemo: 'notification-badge-behavior',
		codeExamples: `# Code Examples
## Svelte

${codeFence}svelte
<script lang="ts">
	let unread = 12;

	function markInboxRead() {
		unread = 0;
	}

	function receiveNotification() {
		unread += 1;
	}

	$: badgeValue = unread > 99 ? '99+' : String(unread);
	$: badgeLabel = unread > 0 ? badgeValue + ' unread notifications' : 'No unread notifications';
</script>

<button type="button" aria-label={badgeLabel}>
	Inbox
	{#if unread > 0}
		<span aria-hidden="true">{badgeValue}</span>
	{/if}
</button>

<button type="button" on:click={markInboxRead}>Mark all read</button>
<button type="button" on:click={receiveNotification}>Simulate new alert</button>
${codeFence}

Count unread items only, clear the badge when the user views the related content, and cap the display before it breaks the layout.`
	},
	'table-sorting-and-pagination-ux': {
		headerDemo: 'table-sorting-pagination',
		codeExamples: `# Code Examples
## Svelte

${codeFence}svelte
<script lang="ts">
	type SortDirection = 'asc' | 'desc';
	let sortBy: 'name' | 'seats' = 'name';
	let sortDirection: SortDirection = 'asc';
	let page = 1;

	function toggleSort(column: 'name' | 'seats') {
		if (sortBy === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortDirection = 'asc';
			page = 1;
		}
	}
</script>

<button type="button" on:click={() => toggleSort('name')}>Sort by name</button>
<button type="button" on:click={() => toggleSort('seats')}>Sort by seats</button>
<p>Page {page}</p>
${codeFence}

Show the active sort, reset pagination when the sort key changes, and reflect the current page in the UI and URL.`
	},
	'theme-toggle-action-icons': {
		headerDemo: 'theme-toggle-next-action'
	},
	'tooltip-vs-popover-when-to-use-which': {
		headerDemo: 'tooltip-vs-popover',
		codeExamples: `# Code Examples
## Svelte

${codeFence}svelte
<script lang="ts">
	let popoverOpen = false;
</script>

<button type="button" aria-describedby="tooltip-copy">?</button>
<span id="tooltip-copy" role="tooltip">Tooltip: brief, non-interactive help.</span>

<button
	type="button"
	aria-expanded={popoverOpen}
	aria-controls="formatting-popover"
	on:click={() => (popoverOpen = !popoverOpen)}
>
	Formatting options
</button>

{#if popoverOpen}
	<div id="formatting-popover" role="dialog" aria-label="Formatting options">
		<button type="button">Bold</button>
		<button type="button">Link</button>
	</div>
{/if}
${codeFence}

Tooltips explain a control in one short sentence. Popovers can contain interactive controls, links, or multi-step guidance.`
	}
};

export function enhanceGuideItem(contentTypeSlug: string, item: ContentItemParsed): ContentItemParsed {
	if (contentTypeSlug !== 'ui-patterns') {
		return item;
	}

	const enhancement = uiPatternEnhancements[item.slug];
	if (!enhancement) {
		return item;
	}

	const fields = { ...item.fields };
	const body = typeof fields.body === 'string' ? fields.body : '';
	const hasCodeExamples = body.includes('# Code Examples');

	if (!fields.header_demo) {
		fields.header_demo = enhancement.headerDemo;
	}

	if (enhancement.codeExamples && !hasCodeExamples) {
		fields.body = `${body.trimEnd()}\n\n${enhancement.codeExamples}`.trim();
	}

	return {
		...item,
		fields
	};
}

export function isSupportedHeaderDemo(value: unknown): value is HeaderDemo {
	return typeof value === 'string' && supportedHeaderDemos.includes(value as HeaderDemo);
}

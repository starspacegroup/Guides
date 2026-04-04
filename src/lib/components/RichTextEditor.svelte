<script lang="ts">
	import { onMount } from 'svelte';

	import { renderMarkdownToHtml } from '$lib/utils/markdown';
	import { editorHtmlToMarkdown } from '$lib/utils/richTextEditor';

	export let value = '';
	export let label = 'Rich text';
	export let placeholder = 'Start writing...';
	export let helpText = 'Supports headings, lists, quotes, links, inline code, and fenced code blocks.';

	type EditorTab = 'visual' | 'preview' | 'markdown';

	let activeTab: EditorTab = 'visual';
	let editorElement: HTMLDivElement | null = null;

	$: previewHtml = renderMarkdownToHtml(value);

	function isEditorFocused(): boolean {
		return typeof document !== 'undefined' && document.activeElement === editorElement;
	}

	function syncEditorFromValue() {
		if (!editorElement || isEditorFocused()) {
			return;
		}

		const nextHtml = previewHtml || '';
		if (editorElement.innerHTML !== nextHtml) {
			editorElement.innerHTML = nextHtml;
		}
	}

	onMount(() => {
		syncEditorFromValue();
	});

	$: if (activeTab === 'visual') {
		syncEditorFromValue();
	}

	function handleEditorInput() {
		if (!editorElement) {
			return;
		}

		value = editorHtmlToMarkdown(editorElement.innerHTML);
	}

	function focusEditor() {
		editorElement?.focus();
	}

	function execCommand(command: string, commandValue?: string) {
		if (typeof document === 'undefined') {
			return;
		}

		focusEditor();
		document.execCommand(command, false, commandValue);
		handleEditorInput();
	}

	function applyBlock(tagName: 'h2' | 'h3' | 'blockquote') {
		execCommand('formatBlock', tagName);
	}

	function insertInlineCode() {
		if (!editorElement || typeof window === 'undefined') {
			return;
		}

		focusEditor();
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			return;
		}

		const range = selection.getRangeAt(0);
		const code = document.createElement('code');
		code.textContent = selection.toString() || 'code';
		range.deleteContents();
		range.insertNode(code);
		selection.removeAllRanges();
		const nextRange = document.createRange();
		nextRange.selectNodeContents(code);
		nextRange.collapse(false);
		selection.addRange(nextRange);
		handleEditorInput();
	}

	function insertCodeBlock() {
		if (!editorElement || typeof window === 'undefined') {
			return;
		}

		focusEditor();
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			return;
		}

		const range = selection.getRangeAt(0);
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = selection.toString() || 'const example = true;';
		pre.append(code);

		const paragraph = document.createElement('p');
		paragraph.append(document.createElement('br'));

		range.deleteContents();
		range.insertNode(paragraph);
		range.insertNode(pre);

		selection.removeAllRanges();
		const nextRange = document.createRange();
		nextRange.selectNodeContents(paragraph);
		nextRange.collapse(true);
		selection.addRange(nextRange);
		handleEditorInput();
	}

	function createLink() {
		if (typeof window === 'undefined') {
			return;
		}

		const href = window.prompt('Enter a URL', 'https://');
		if (!href) {
			return;
		}

		execCommand('createLink', href);
	}

	function handleMarkdownInput(event: Event) {
		const target = event.currentTarget as HTMLTextAreaElement;
		value = target.value;
	}

	function handleEditorKeydown(event: KeyboardEvent) {
		if (!(event.metaKey || event.ctrlKey)) {
			return;
		}

		const key = event.key.toLowerCase();
		if (key === 'b') {
			event.preventDefault();
			execCommand('bold');
		}
		if (key === 'i') {
			event.preventDefault();
			execCommand('italic');
		}
		if (key === 'k') {
			event.preventDefault();
			createLink();
		}
	}
</script>

<div class="rich-text-editor">
	<div class="rich-text-editor__header">
		<div class="rich-text-editor__tabs" role="tablist" aria-label="{label} editor views">
			<button
				type="button"
				class="rich-text-editor__tab"
				class:is-active={activeTab === 'visual'}
				role="tab"
				aria-selected={activeTab === 'visual'}
				on:click={() => (activeTab = 'visual')}
			>
				Visual
			</button>
			<button
				type="button"
				class="rich-text-editor__tab"
				class:is-active={activeTab === 'preview'}
				role="tab"
				aria-selected={activeTab === 'preview'}
				on:click={() => (activeTab = 'preview')}
			>
				Preview
			</button>
			<button
				type="button"
				class="rich-text-editor__tab"
				class:is-active={activeTab === 'markdown'}
				role="tab"
				aria-selected={activeTab === 'markdown'}
				on:click={() => (activeTab = 'markdown')}
			>
				Markdown
			</button>
		</div>

		<div class="rich-text-editor__toolbar" role="toolbar" aria-label="{label} formatting toolbar">
			<button type="button" on:click={() => execCommand('bold')} aria-label="Bold">B</button>
			<button type="button" on:click={() => execCommand('italic')} aria-label="Italic">I</button>
			<button type="button" on:click={() => applyBlock('h2')} aria-label="Heading 2">H2</button>
			<button type="button" on:click={() => applyBlock('h3')} aria-label="Heading 3">H3</button>
			<button
				type="button"
				on:click={() => execCommand('insertUnorderedList')}
				aria-label="Bulleted list"
			>
				List
			</button>
			<button
				type="button"
				on:click={() => execCommand('insertOrderedList')}
				aria-label="Numbered list"
			>
				1.
			</button>
			<button type="button" on:click={() => applyBlock('blockquote')} aria-label="Blockquote">
				Quote
			</button>
			<button type="button" on:click={insertInlineCode} aria-label="Inline code">&lt;/&gt;</button>
			<button type="button" on:click={insertCodeBlock} aria-label="Code block">Code block</button>
			<button type="button" on:click={createLink} aria-label="Insert link">Link</button>
		</div>
	</div>

	{#if activeTab === 'visual'}
		<div
			bind:this={editorElement}
			class="rich-text-editor__surface"
			role="textbox"
			tabindex="0"
			aria-multiline="true"
			aria-label="{label} visual editor"
			contenteditable="true"
			data-placeholder={placeholder}
			on:input={handleEditorInput}
			on:keydown={handleEditorKeydown}
		></div>
	{:else if activeTab === 'preview'}
		<div class="rich-text-editor__preview" aria-label="{label} preview">
			{#if previewHtml}
				{@html previewHtml}
			{:else}
				<p class="rich-text-editor__empty">Nothing to preview yet.</p>
			{/if}
		</div>
	{:else}
		<textarea
			class="rich-text-editor__source"
			aria-label="{label} markdown source"
			rows="12"
			value={value}
			on:input={handleMarkdownInput}
		></textarea>
	{/if}

	{#if helpText}
		<p class="rich-text-editor__help">{helpText}</p>
	{/if}
</div>

<style>
	.rich-text-editor {
		display: grid;
		gap: var(--spacing-sm);
	}

	.rich-text-editor__header {
		display: grid;
		gap: var(--spacing-sm);
	}

	.rich-text-editor__tabs,
	.rich-text-editor__toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.rich-text-editor__tab,
	.rich-text-editor__toolbar button {
		appearance: none;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		border-radius: var(--radius-sm);
		padding: var(--spacing-xs) var(--spacing-sm);
		font: inherit;
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast),
			color var(--transition-fast);
	}

	.rich-text-editor__tab:hover,
	.rich-text-editor__tab.is-active,
	.rich-text-editor__toolbar button:hover {
		background: var(--color-background-secondary);
		border-color: var(--color-primary);
	}

	.rich-text-editor__surface,
	.rich-text-editor__preview,
	.rich-text-editor__source {
		min-height: 18rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		padding: var(--spacing-md);
	}

	.rich-text-editor__surface {
		outline: none;
		line-height: 1.6;
	}

	.rich-text-editor__surface:focus,
	.rich-text-editor__source:focus {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-subtle);
	}

	.rich-text-editor__surface:empty::before {
		content: attr(data-placeholder);
		color: var(--color-text-secondary);
	}

	.rich-text-editor__surface :global(pre),
	.rich-text-editor__preview :global(pre) {
		overflow-x: auto;
		padding: var(--spacing-md);
		border-radius: var(--radius-sm);
		background: var(--color-background-secondary);
	}

	.rich-text-editor__surface :global(blockquote),
	.rich-text-editor__preview :global(blockquote) {
		margin: 0;
		padding-left: var(--spacing-md);
		border-left: 3px solid var(--color-border);
	}

	.rich-text-editor__source {
		width: 100%;
		resize: vertical;
		font-family: inherit;
	}

	.rich-text-editor__empty,
	.rich-text-editor__help {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: 0.95rem;
	}
</style>
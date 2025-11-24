<script lang="ts">
	import { onMount } from 'svelte';

	let { value = $bindable(''), placeholder = 'Write something...' } = $props();

	let editorElement: HTMLDivElement;
	let isActive = $state({
		bold: false,
		italic: false,
		h1: false,
		h2: false,
		h3: false,
		ul: false,
		ol: false,
		code: false
	});

	onMount(() => {
		if (value) {
			editorElement.innerHTML = value;
		}
		updateActiveStates();
	});

	function handleInput() {
		value = editorElement.innerHTML;
		updateActiveStates();
	}

	function updateActiveStates() {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		isActive = {
			bold: document.queryCommandState('bold'),
			italic: document.queryCommandState('italic'),
			h1: isInTag('H1'),
			h2: isInTag('H2'),
			h3: isInTag('H3'),
			ul: isInTag('UL'),
			ol: isInTag('OL'),
			code: isInTag('CODE') || isInTag('PRE')
		};
	}

	function isInTag(tagName: string): boolean {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return false;
		
		let node = selection.anchorNode;
		while (node && node !== editorElement) {
			if (node.nodeType === 1 && (node as Element).tagName === tagName) {
				return true;
			}
			node = node.parentNode;
		}
		return false;
	}

	function execCommand(command: string, value?: string) {
		document.execCommand(command, false, value);
		editorElement.focus();
		handleInput();
	}

	function toggleBold() {
		execCommand('bold');
	}

	function toggleItalic() {
		execCommand('italic');
	}

	function toggleHeading(level: 1 | 2 | 3) {
		execCommand('formatBlock', `<h${level}>`);
	}

	function toggleBulletList() {
		execCommand('insertUnorderedList');
	}

	function toggleOrderedList() {
		execCommand('insertOrderedList');
	}

	function insertCodeBlock() {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		const range = selection.getRangeAt(0);
		const selectedText = range.toString();
		
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = selectedText || 'Your code here';
		pre.appendChild(code);
		
		range.deleteContents();
		range.insertNode(pre);
		
		// Move cursor after the code block
		range.setStartAfter(pre);
		range.setEndAfter(pre);
		selection.removeAllRanges();
		selection.addRange(range);
		
		handleInput();
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Handle Tab key for indentation
		if (event.key === 'Tab') {
			event.preventDefault();
			execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
		}
		
		// Update active states after key operations
		setTimeout(updateActiveStates, 10);
	}

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		
		const text = event.clipboardData?.getData('text/plain');
		if (text) {
			document.execCommand('insertText', false, text);
		}
	}
</script>

<div class="editor-container">
	<div class="menu-bar">
		<button 
			type="button" 
			onclick={toggleBold} 
			class="menu-btn"
			class:active={isActive.bold}
			title="Bold (Ctrl+B)"
		>
			<strong>B</strong>
		</button>
		<button 
			type="button" 
			onclick={toggleItalic} 
			class="menu-btn"
			class:active={isActive.italic}
			title="Italic (Ctrl+I)"
		>
			<em>I</em>
		</button>
		<button 
			type="button" 
			onclick={() => toggleHeading(1)} 
			class="menu-btn"
			class:active={isActive.h1}
			title="Heading 1"
		>
			H1
		</button>
		<button 
			type="button" 
			onclick={() => toggleHeading(2)} 
			class="menu-btn"
			class:active={isActive.h2}
			title="Heading 2"
		>
			H2
		</button>
		<button 
			type="button" 
			onclick={() => toggleHeading(3)} 
			class="menu-btn"
			class:active={isActive.h3}
			title="Heading 3"
		>
			H3
		</button>
		<button 
			type="button" 
			onclick={toggleBulletList} 
			class="menu-btn"
			class:active={isActive.ul}
			title="Bullet List"
		>
			• List
		</button>
		<button 
			type="button" 
			onclick={toggleOrderedList} 
			class="menu-btn"
			class:active={isActive.ol}
			title="Numbered List"
		>
			1. List
		</button>
		<button 
			type="button" 
			onclick={insertCodeBlock} 
			class="menu-btn"
			class:active={isActive.code}
			title="Code Block"
		>
			&lt;/&gt;
		</button>
	</div>
	<div 
		bind:this={editorElement}
		class="editor-content"
		contenteditable="true"
		oninput={handleInput}
		onkeydown={handleKeyDown}
		onpaste={handlePaste}
		onmouseup={updateActiveStates}
		onkeyup={updateActiveStates}
		role="textbox"
		tabindex="0"
		aria-multiline="true"
		aria-label="Rich text editor"
		{placeholder}
	></div>
</div>

<style>
	.editor-container {
		border: 1px solid var(--border-secondary);
		border-radius: 4px;
		overflow: hidden;
		background: var(--bg-primary);
	}

	.menu-bar {
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-secondary);
		padding: 0.5rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.menu-btn {
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 4px;
		padding: 0.5rem 0.75rem;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s;
		min-width: 2.5rem;
		color: var(--text-primary);
	}

	.menu-btn:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-primary);
	}

	.menu-btn:active,
	.menu-btn.active {
		background: var(--nav-bg);
		color: var(--nav-text);
		border-color: var(--nav-bg);
	}

	.editor-content {
		min-height: 200px;
		padding: 1rem;
		outline: none;
		line-height: 1.6;
		color: var(--text-primary);
	}

	.editor-content:empty:before {
		content: attr(placeholder);
		color: var(--text-tertiary);
		pointer-events: none;
	}

	.editor-content :global(p) {
		margin: 0.5rem 0;
	}

	.editor-content :global(h1) {
		font-size: 2rem;
		font-weight: bold;
		margin: 1rem 0 0.5rem 0;
		color: var(--text-primary);
	}

	.editor-content :global(h2) {
		font-size: 1.5rem;
		font-weight: bold;
		margin: 1rem 0 0.5rem 0;
		color: var(--text-primary);
	}

	.editor-content :global(h3) {
		font-size: 1.25rem;
		font-weight: bold;
		margin: 1rem 0 0.5rem 0;
		color: var(--text-primary);
	}

	.editor-content :global(ul),
	.editor-content :global(ol) {
		padding-left: 2rem;
		margin: 0.5rem 0;
	}

	.editor-content :global(li) {
		margin: 0.25rem 0;
	}

	.editor-content :global(pre) {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-secondary);
		border-radius: 4px;
		padding: 1rem;
		overflow-x: auto;
		margin: 0.5rem 0;
		font-family: 'Courier New', Courier, monospace;
	}

	.editor-content :global(code) {
		background: var(--bg-tertiary);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.9em;
	}

	.editor-content :global(pre code) {
		background: none;
		padding: 0;
		display: block;
	}

	.editor-content :global(strong) {
		font-weight: bold;
	}

	.editor-content :global(em) {
		font-style: italic;
	}

	.editor-content :global(blockquote) {
		border-left: 3px solid var(--nav-bg);
		margin: 1rem 0;
		padding-left: 1rem;
		color: var(--text-secondary);
	}
</style>

<script context="module" lang="ts">
	let editorInstanceCount = 0;
</script>

<script lang="ts">
	import { onMount, tick } from 'svelte';

	import { enhanceCodeBlocks } from '$lib/utils/codeBlocks';
	import { renderMarkdownToHtml } from '$lib/utils/markdown';
	import { editorHtmlToMarkdown } from '$lib/utils/richTextEditor';

	export let value = '';
	export let label = 'Rich text';
	export let placeholder = 'Start writing...';
	export let helpText = 'Supports headings, lists, tables, images, links, and fenced code blocks with languages.';
	export let startExpanded = false;

	const DESKTOP_MEDIA_QUERY = '(min-width: 960px)';

	type EditorTab = 'visual' | 'preview' | 'markdown';
	type CodeLanguage = 'plaintext' | 'ts' | 'js' | 'python' | 'html' | 'css' | 'json' | 'sql' | 'bash';
	type CompatibleMediaQueryList = MediaQueryList & {
		addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
		removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
	};

	let activeTab: EditorTab = 'visual';
	let editorElement: HTMLDivElement | null = null;
	let languagePickerElement: HTMLSelectElement | null = null;
	let isExpanded = startExpanded;
	let codeLanguage: CodeLanguage = 'ts';
	let isDesktopLayout =
		typeof window !== 'undefined' && typeof window.matchMedia === 'function'
			? window.matchMedia(DESKTOP_MEDIA_QUERY).matches
			: false;
	let isToolsPanelOpen = isDesktopLayout;
	let isGuidePanelOpen = isDesktopLayout;
	const editorInstanceId = `rich-text-editor-${++editorInstanceCount}`;
	let previousBodyOverflow = '';
	let previousHtmlOverflow = '';
	let isScrollLocked = false;

	const codeLanguageOptions: { value: CodeLanguage; label: string; }[] = [
		{ value: 'plaintext', label: 'Plain text' },
		{ value: 'ts', label: 'TypeScript' },
		{ value: 'js', label: 'JavaScript' },
		{ value: 'python', label: 'Python' },
		{ value: 'html', label: 'HTML' },
		{ value: 'css', label: 'CSS' },
		{ value: 'json', label: 'JSON' },
		{ value: 'sql', label: 'SQL' },
		{ value: 'bash', label: 'Bash' }
	];

	$: previewHtml = renderMarkdownToHtml(value);
	$: wordCount = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;
	$: characterCount = value.length;
	$: readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));
	$: showFormattingTools = isDesktopLayout || isToolsPanelOpen;
	$: showGuide = isExpanded && (isDesktopLayout || isGuidePanelOpen);

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

		if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
			return;
		}

		const desktopMedia = window.matchMedia(DESKTOP_MEDIA_QUERY) as CompatibleMediaQueryList;

		const syncResponsivePanels = (matches: boolean) => {
			isDesktopLayout = matches;
			if (matches) {
				isToolsPanelOpen = true;
				isGuidePanelOpen = true;
			} else {
				isToolsPanelOpen = false;
				isGuidePanelOpen = false;
			}
		};

		syncResponsivePanels(desktopMedia.matches);

		const handleResponsiveChange = (event: MediaQueryListEvent) => {
			syncResponsivePanels(event.matches);
		};

		if (typeof desktopMedia.addEventListener === 'function') {
			desktopMedia.addEventListener('change', handleResponsiveChange);
		} else {
			desktopMedia.addListener?.(handleResponsiveChange);
		}

		return () => {
			syncDocumentScrollLock(false);
			if (typeof desktopMedia.removeEventListener === 'function') {
				desktopMedia.removeEventListener('change', handleResponsiveChange);
			} else {
				desktopMedia.removeListener?.(handleResponsiveChange);
			}
		};
	});

	$: if (activeTab === 'visual') {
		syncEditorFromValue();
	}

	$: syncDocumentScrollLock(isExpanded);

	function handleEditorInput() {
		if (!editorElement) {
			return;
		}

		value = editorHtmlToMarkdown(editorElement.innerHTML);
	}

	function focusEditor() {
		editorElement?.focus();
	}

	function syncDocumentScrollLock(shouldLock: boolean) {
		if (typeof document === 'undefined') {
			return;
		}

		if (shouldLock && !isScrollLocked) {
			previousBodyOverflow = document.body.style.overflow;
			previousHtmlOverflow = document.documentElement.style.overflow;
			document.body.style.overflow = 'hidden';
			document.documentElement.style.overflow = 'hidden';
			isScrollLocked = true;
			return;
		}

		if (!shouldLock && isScrollLocked) {
			document.body.style.overflow = previousBodyOverflow;
			document.documentElement.style.overflow = previousHtmlOverflow;
			isScrollLocked = false;
		}
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
		const nextLanguage = (languagePickerElement?.value || codeLanguage) as CodeLanguage;
		const selectedLanguage = nextLanguage && nextLanguage !== 'plaintext' ? nextLanguage : '';
		const selectedText = selection?.toString() || 'const example = true;';
		const pre = document.createElement('pre');
		if (selectedLanguage) {
			pre.dataset.language = selectedLanguage;
		}
		const code = document.createElement('code');
		if (selectedLanguage) {
			code.className = `language-${selectedLanguage}`;
		}
		code.textContent = selectedText;
		pre.append(code);

		const paragraph = document.createElement('p');
		paragraph.append(document.createElement('br'));

		if (!selection || selection.rangeCount === 0) {
			editorElement.append(pre, paragraph);
		} else {
			const range = selection.getRangeAt(0);
			range.deleteContents();
			range.insertNode(paragraph);
			range.insertNode(pre);

			selection.removeAllRanges();
			const nextRange = document.createRange();
			nextRange.selectNodeContents(paragraph);
			nextRange.collapse(true);
			selection.addRange(nextRange);
		}
		handleEditorInput();
	}

	function insertImage() {
		if (!editorElement || typeof window === 'undefined') {
			return;
		}

		const src = window.prompt('Paste the image URL', 'https://');
		if (!src) {
			return;
		}

		const alt = window.prompt('Describe the image for accessibility', 'Illustration') ?? '';
		const title = window.prompt('Optional image caption', '') ?? '';

		focusEditor();
		const image = document.createElement('img');
		image.src = src;
		image.alt = alt;
		if (title.trim()) {
			image.title = title.trim();
		}

		const figure = document.createElement('figure');
		figure.append(image);

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			editorElement.append(figure);
		} else {
			const range = selection.getRangeAt(0);
			range.deleteContents();
			range.insertNode(figure);
		}

		const paragraph = document.createElement('p');
		paragraph.append(document.createElement('br'));
		figure.after(paragraph);
		handleEditorInput();
	}

	function insertTable() {
		if (!editorElement || typeof window === 'undefined') {
			return;
		}

		focusEditor();
		const table = document.createElement('table');
		const thead = document.createElement('thead');
		const headerRow = document.createElement('tr');
		for (const heading of ['Column 1', 'Column 2']) {
			const cell = document.createElement('th');
			cell.textContent = heading;
			headerRow.append(cell);
		}
		thead.append(headerRow);

		const tbody = document.createElement('tbody');
		for (const rowValues of [
			['Value 1', 'Value 2'],
			['Value 3', 'Value 4']
		]) {
			const row = document.createElement('tr');
			for (const value of rowValues) {
				const cell = document.createElement('td');
				cell.textContent = value;
				row.append(cell);
			}
			tbody.append(row);
		}
		table.append(thead, tbody);

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			editorElement.append(table);
		} else {
			const range = selection.getRangeAt(0);
			range.deleteContents();
			range.insertNode(table);
		}

		const paragraph = document.createElement('p');
		paragraph.append(document.createElement('br'));
		table.after(paragraph);
		handleEditorInput();
	}

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}

	function handleExpandToggle(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (isExpanded) {
			toggleExpanded();
			return;
		}

		void enterFocusedEditor();
	}

	function toggleToolsPanel() {
		isToolsPanelOpen = !isToolsPanelOpen;
	}

	function toggleGuidePanel() {
		isGuidePanelOpen = !isGuidePanelOpen;
	}

	async function setActiveTab(nextTab: EditorTab) {
		activeTab = nextTab;
		if (nextTab === 'visual') {
			await tick();
			focusEditor();
		}
	}

	async function enterFocusedEditor() {
		if (!isExpanded) {
			isExpanded = true;
		}

		if (!isDesktopLayout) {
			isToolsPanelOpen = false;
			isGuidePanelOpen = false;
		}

		await tick();

		if (activeTab === 'visual') {
			focusEditor();
		}
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

	function handleLanguageChange(event: Event) {
		codeLanguage = (event.currentTarget as HTMLSelectElement).value as CodeLanguage;
	}

	function handleEditorKeydown(event: KeyboardEvent) {
		if (isExpanded && event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			isExpanded = false;
			return;
		}

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

	function bindEditorKeydown(node: HTMLDivElement) {
		const handleKeydown = (event: KeyboardEvent) => {
			handleEditorKeydown(event);
		};

		node.addEventListener('keydown', handleKeydown);

		return {
			destroy() {
				node.removeEventListener('keydown', handleKeydown);
			}
		};
	}

	function getVisibleModeLabel(tab: EditorTab) {
		if (tab === 'visual') {
			return 'Visual mode';
		}

		if (tab === 'preview') {
			return 'Preview mode';
		}

		return 'Markdown mode';
	}
</script>

<div class="rich-text-editor" class:is-expanded={isExpanded} use:bindEditorKeydown>
	<div class="rich-text-editor__shell">
		<div class="rich-text-editor__hero">
			<div class="rich-text-editor__hero-copy">
				<span class="rich-text-editor__eyebrow">Editorial workspace</span>
				<h3>{label}</h3>
				<p>{helpText}</p>
			</div>
			<div class="rich-text-editor__hero-actions">
				<div class="rich-text-editor__metrics" aria-label="Editor metrics">
					<span>{wordCount} words</span>
					<span>{characterCount} chars</span>
					<span>{readingTimeMinutes} min read</span>
				</div>
				<button type="button" class="rich-text-editor__expand" on:click={handleExpandToggle}>
					{isExpanded ? 'Exit full-page editor' : 'Open full-page editor'}
				</button>
			</div>
		</div>

		<div class="rich-text-editor__workspace">
			<section class="rich-text-editor__canvas">
				<div class="rich-text-editor__header">
					<div class="rich-text-editor__mode-summary">
						<span class="rich-text-editor__mode-pill">{getVisibleModeLabel(activeTab)}</span>
						{#if !isDesktopLayout}
							<span class="rich-text-editor__mode-note">Core tools stay tucked away until you need them.</span>
						{/if}
					</div>
					<div class="rich-text-editor__workspace-controls">
						<div class="rich-text-editor__tabs" role="tablist" aria-label="{label} editor views">
			<button
				type="button"
				class="rich-text-editor__tab"
				class:is-active={activeTab === 'visual'}
				role="tab"
				aria-selected={activeTab === 'visual'}
				on:click={() => void setActiveTab('visual')}
			>
				Visual
			</button>
			<button
				type="button"
				class="rich-text-editor__tab"
				class:is-active={activeTab === 'preview'}
				role="tab"
				aria-selected={activeTab === 'preview'}
				on:click={() => void setActiveTab('preview')}
			>
				Preview
			</button>
			<button
				type="button"
				class="rich-text-editor__tab"
				class:is-active={activeTab === 'markdown'}
				role="tab"
				aria-selected={activeTab === 'markdown'}
				on:click={() => void setActiveTab('markdown')}
			>
				Markdown
			</button>
						</div>

						{#if !isDesktopLayout}
							<div class="rich-text-editor__panel-toggles">
								<button
									type="button"
									class="rich-text-editor__panel-toggle"
									aria-controls={`${editorInstanceId}-tools`}
									aria-expanded={showFormattingTools}
									on:click={toggleToolsPanel}
								>
									{showFormattingTools ? 'Hide formatting tools' : 'Show formatting tools'}
								</button>
								{#if isExpanded}
									<button
										type="button"
										class="rich-text-editor__panel-toggle"
										aria-controls={`${editorInstanceId}-guide`}
										aria-expanded={showGuide}
										on:click={toggleGuidePanel}
									>
										{showGuide ? 'Hide writing guide' : 'Show writing guide'}
									</button>
								{/if}
							</div>
						{/if}
					</div>

					{#if !isDesktopLayout && activeTab === 'visual'}
						<div class="rich-text-editor__quick-inserts" aria-label="Quick insert actions">
							<button type="button" class="rich-text-editor__quick-insert" aria-label="Quick insert image" on:click={insertImage}>
								Image
							</button>
							<button type="button" class="rich-text-editor__quick-insert" aria-label="Quick insert table" on:click={insertTable}>
								Table
							</button>
							<button type="button" class="rich-text-editor__quick-insert" aria-label="Quick insert code block" on:click={insertCodeBlock}>
								Snippet
							</button>
						</div>
					{/if}

					{#if showFormattingTools}
						<div class="rich-text-editor__toolbar-stack" id={`${editorInstanceId}-tools`}>
							<div class="rich-text-editor__toolbar" role="toolbar" aria-label="{label} formatting toolbar">
								<div class="rich-text-editor__group">
									<button type="button" on:click={() => execCommand('bold')} aria-label="Bold">Bold</button>
									<button type="button" on:click={() => execCommand('italic')} aria-label="Italic">Italic</button>
									<button type="button" on:click={createLink} aria-label="Insert link">Link</button>
								</div>
								<div class="rich-text-editor__group">
									<button type="button" on:click={() => applyBlock('h2')} aria-label="Heading 2">H2</button>
									<button type="button" on:click={() => applyBlock('h3')} aria-label="Heading 3">H3</button>
									<button type="button" on:click={() => applyBlock('blockquote')} aria-label="Blockquote">Quote</button>
								</div>
								<div class="rich-text-editor__group">
									<button type="button" on:click={() => execCommand('insertUnorderedList')} aria-label="Bulleted list">Bullets</button>
									<button type="button" on:click={() => execCommand('insertOrderedList')} aria-label="Numbered list">Numbered</button>
									<button type="button" on:click={insertInlineCode} aria-label="Inline code">Inline code</button>
								</div>
								<div class="rich-text-editor__group rich-text-editor__group--highlight">
									<label class="rich-text-editor__language-picker">
										<span>Code block language</span>
										<select
											bind:this={languagePickerElement}
											aria-label="Code block language"
											bind:value={codeLanguage}
											on:change={handleLanguageChange}
										>
											{#each codeLanguageOptions as option}
												<option value={option.value}>{option.label}</option>
											{/each}
										</select>
									</label>
									<button type="button" on:click={insertCodeBlock} aria-label="Code block">Code block</button>
									<button type="button" on:click={insertImage} aria-label="Insert image">Insert image</button>
									<button type="button" on:click={insertTable} aria-label="Insert table">Insert table</button>
								</div>
							</div>

							<div class="rich-text-editor__quick-actions">
								<button type="button" class="rich-text-editor__quick-card" on:click={insertImage}>
									<strong>Drop an image</strong>
									<span>Paste a hosted image URL and keep alt text close at hand.</span>
								</button>
								<button type="button" class="rich-text-editor__quick-card" on:click={insertTable}>
									<strong>Build a table</strong>
									<span>Start with a clean two-column structure and edit in markdown if needed.</span>
								</button>
								<button type="button" class="rich-text-editor__quick-card" on:click={insertCodeBlock}>
									<strong>Insert a snippet</strong>
									<span>Language-aware fences keep code readable in preview and on the public site.</span>
								</button>
							</div>
						</div>
					{/if}
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
					></div>
				{:else if activeTab === 'preview'}
					<div class="rich-text-editor__preview" aria-label="{label} preview" use:enhanceCodeBlocks>
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
			</section>

			{#if showGuide}
				<aside
					class="rich-text-editor__sidebar"
					id={`${editorInstanceId}-guide`}
					aria-label="Editor guide"
				>
					<section class="rich-text-editor__panel">
						<h4>Quick structure</h4>
						<p>Lead with a sharp heading, then mix narrative blocks with tables, imagery, and annotated code.</p>
					</section>
					<section class="rich-text-editor__panel">
						<h4>Current insertions</h4>
						<div class="rich-text-editor__chips">
							<span>Images</span>
							<span>Tables</span>
							<span>{codeLanguage === 'plaintext' ? 'Plain code' : codeLanguage}</span>
						</div>
					</section>
					<section class="rich-text-editor__panel">
						<h4>Keyboard hints</h4>
						<p>Use Ctrl/Cmd+B for bold, Ctrl/Cmd+I for italic, and Ctrl/Cmd+K for links.</p>
					</section>
				</aside>
			{/if}
		</div>
	</div>

	{#if helpText && !isExpanded}
		<p class="rich-text-editor__help">{helpText}</p>
	{/if}
</div>

<style>
	.rich-text-editor {
		display: grid;
		gap: var(--spacing-sm);
	}

	.rich-text-editor.is-expanded {
		position: fixed;
		inset: 0;
		z-index: 120;
		padding: var(--spacing-xs);
		background:
			linear-gradient(160deg, var(--color-background) 0%, var(--color-surface) 55%, var(--color-background) 100%);
	}

	.rich-text-editor__shell {
		display: grid;
		gap: var(--spacing-md);
		padding: var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		background:
			linear-gradient(180deg, var(--color-surface) 0%, var(--color-background) 100%);
		box-shadow: var(--shadow-lg);
	}

	.rich-text-editor.is-expanded .rich-text-editor__shell {
		height: calc(100dvh - (var(--spacing-xs) * 2));
		padding: var(--spacing-sm);
		box-shadow: var(--shadow-xl);
	}

	.rich-text-editor__hero {
		display: grid;
		gap: var(--spacing-md);
		padding: var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: linear-gradient(135deg, var(--color-background) 0%, var(--color-surface) 100%);
	}

	.rich-text-editor__hero-copy {
		display: grid;
		gap: var(--spacing-xs);
		max-width: 44rem;
	}

	.rich-text-editor__hero-copy h3 {
		font-size: 1.4rem;
		line-height: 1.2;
	}

	.rich-text-editor__hero-copy p {
		color: var(--color-text-secondary);
	}

	.rich-text-editor__eyebrow {
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-primary);
	}

	.rich-text-editor__hero-actions {
		display: grid;
		gap: var(--spacing-sm);
		justify-items: start;
	}

	.rich-text-editor__metrics {
		display: flex;
		gap: var(--spacing-xs);
		flex-wrap: wrap;
	}

	.rich-text-editor__metrics span,
	.rich-text-editor__chips span {
		padding: var(--spacing-xs) var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-background);
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__expand {
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-md);
		background: var(--color-primary);
		color: var(--color-background);
		font-weight: 600;
	}

	.rich-text-editor__workspace,
	.rich-text-editor__canvas,
	.rich-text-editor__workspace-controls,
	.rich-text-editor__toolbar-stack {
		display: grid;
		gap: var(--spacing-md);
		min-height: 0;
	}

	.rich-text-editor.is-expanded .rich-text-editor__canvas {
		grid-template-rows: auto minmax(0, 1fr);
	}

	.rich-text-editor.is-expanded .rich-text-editor__header {
		position: sticky;
		top: 0;
		z-index: 2;
		backdrop-filter: blur(16px);
	}

	.rich-text-editor__header {
		display: grid;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-background);
	}

	.rich-text-editor__mode-summary {
		display: grid;
		gap: 0.35rem;
	}

	.rich-text-editor__mode-pill {
		width: fit-content;
		padding: 0.35rem 0.65rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__mode-note {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__panel-toggles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--spacing-xs);
	}

	.rich-text-editor__quick-inserts {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--spacing-xs);
	}

	.rich-text-editor__panel-toggle,
	.rich-text-editor__tab,
	.rich-text-editor__quick-insert,
	.rich-text-editor__toolbar button,
	.rich-text-editor__quick-card,
	.rich-text-editor__language-picker select {
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

	.rich-text-editor__panel-toggle {
		padding: var(--spacing-sm);
		font-weight: 600;
		text-align: left;
	}

	.rich-text-editor__quick-insert {
		padding: 0.7rem var(--spacing-sm);
		font-weight: 600;
		text-align: center;
	}

	.rich-text-editor__tabs,
	.rich-text-editor__toolbar {
		display: flex;
		gap: var(--spacing-xs);
		overflow-x: auto;
		scrollbar-width: thin;
	}

	.rich-text-editor__tabs {
		padding-bottom: 0.1rem;
	}

	.rich-text-editor__toolbar {
		align-items: flex-end;
		flex-wrap: wrap;
	}

	.rich-text-editor__group {
		display: flex;
		gap: var(--spacing-xs);
		flex-wrap: wrap;
		padding: var(--spacing-xs);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.rich-text-editor__group--highlight {
		background: linear-gradient(180deg, var(--color-background) 0%, var(--color-surface) 100%);
	}

	.rich-text-editor__panel-toggle:hover,
	.rich-text-editor__tab:hover,
	.rich-text-editor__tab.is-active,
	.rich-text-editor__quick-insert:hover,
	.rich-text-editor__toolbar button:hover,
	.rich-text-editor__quick-card:hover,
	.rich-text-editor__panel-toggle[aria-expanded='true'] {
		background: var(--color-background-secondary);
		border-color: var(--color-primary);
	}

	.rich-text-editor__language-picker {
		display: grid;
		gap: 0.2rem;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__language-picker select {
		padding-right: 2rem;
		font-size: 0.9rem;
	}

	.rich-text-editor__quick-actions {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-sm);
	}

	.rich-text-editor__quick-card {
		display: grid;
		gap: 0.35rem;
		text-align: left;
		padding: var(--spacing-md);
		background: linear-gradient(180deg, var(--color-background) 0%, var(--color-surface) 100%);
	}

	.rich-text-editor__quick-card strong {
		font-size: 0.95rem;
	}

	.rich-text-editor__quick-card span {
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__surface,
	.rich-text-editor__preview,
	.rich-text-editor__source {
		min-height: 18rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		padding: var(--spacing-md);
		box-shadow: var(--shadow-sm);
	}

	.rich-text-editor.is-expanded .rich-text-editor__surface,
	.rich-text-editor.is-expanded .rich-text-editor__preview,
	.rich-text-editor.is-expanded .rich-text-editor__source {
		min-height: 0;
		height: 100%;
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
		border: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.rich-text-editor__preview :global(.cms-code-block) {
		margin: 0 0 var(--spacing-md);
	}

	.rich-text-editor__preview :global(.cms-code-block-toolbar) {
		padding: var(--spacing-sm) var(--spacing-md);
	}

	.rich-text-editor__preview :global(.cms-code-block pre) {
		margin: 0;
		border: none;
		background: transparent;
		box-shadow: none;
	}

	.rich-text-editor__preview :global(.cms-code-block code) {
		display: block;
		color: var(--color-code-text);
	}

	.rich-text-editor__preview :global(.token.keyword) {
		color: var(--color-code-keyword);
	}

	.rich-text-editor__preview :global(.token.string) {
		color: var(--color-code-string);
	}

	.rich-text-editor__preview :global(.token.boolean) {
		color: var(--color-code-boolean);
	}

	.rich-text-editor__preview :global(.token.number) {
		color: var(--color-code-number);
	}

	.rich-text-editor__preview :global(.token.comment) {
		color: var(--color-code-comment);
	}

	.rich-text-editor__surface :global(blockquote),
	.rich-text-editor__preview :global(blockquote) {
		margin: 0;
		padding-left: var(--spacing-md);
		border-left: 3px solid var(--color-border);
	}

	.rich-text-editor__surface :global(figure),
	.rich-text-editor__preview :global(figure) {
		margin: 0;
		display: grid;
		gap: var(--spacing-xs);
	}

	.rich-text-editor__surface :global(img),
	.rich-text-editor__preview :global(img) {
		max-width: 100%;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
	}

	.rich-text-editor__surface :global(table),
	.rich-text-editor__preview :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.95rem;
	}

	.rich-text-editor__surface :global(th),
	.rich-text-editor__surface :global(td),
	.rich-text-editor__preview :global(th),
	.rich-text-editor__preview :global(td) {
		padding: var(--spacing-sm);
		border: 1px solid var(--color-border);
		text-align: left;
	}

	.rich-text-editor__surface :global(th),
	.rich-text-editor__preview :global(th) {
		background: var(--color-surface);
	}

	.rich-text-editor__source {
		width: 100%;
		resize: none;
		font-family: var(--font-mono);
		font-size: 0.9rem;
	}

	.rich-text-editor__sidebar {
		display: grid;
		gap: var(--spacing-sm);
		align-content: start;
	}

	.rich-text-editor__panel {
		display: grid;
		gap: var(--spacing-xs);
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-background);
		box-shadow: var(--shadow-sm);
	}

	.rich-text-editor__panel h4 {
		font-size: 0.95rem;
	}

	.rich-text-editor__panel p {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__chips {
		display: flex;
		gap: var(--spacing-xs);
		flex-wrap: wrap;
	}

	.rich-text-editor__empty,
	.rich-text-editor__help {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: 0.95rem;
	}

	@media (min-width: 960px) {
		.rich-text-editor.is-expanded {
			padding: var(--spacing-lg);
		}

		.rich-text-editor.is-expanded .rich-text-editor__shell {
			height: calc(100dvh - (var(--spacing-lg) * 2));
			padding: var(--spacing-lg);
		}

		.rich-text-editor__hero {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: start;
			padding: var(--spacing-md);
		}

		.rich-text-editor__mode-summary {
			grid-template-columns: auto 1fr;
			align-items: center;
		}

		.rich-text-editor__hero-actions {
			justify-items: end;
		}

		.rich-text-editor__expand {
			width: auto;
		}

		.rich-text-editor__tabs {
			flex-wrap: wrap;
			overflow: visible;
		}

		.rich-text-editor__quick-actions {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.rich-text-editor__quick-inserts {
			max-width: 24rem;
		}

		.rich-text-editor__surface,
		.rich-text-editor__preview,
		.rich-text-editor__source {
			min-height: 24rem;
			padding: var(--spacing-lg);
		}

		.rich-text-editor.is-expanded .rich-text-editor__workspace {
			grid-template-columns: minmax(0, 1fr) 20rem;
		}

		.rich-text-editor__sidebar {
			position: sticky;
			top: 0;
		}
	}
</style>
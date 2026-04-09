<script context="module" lang="ts">
	let editorInstanceCount = 0;
</script>

<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';

	import { enhanceCodeBlocks } from '$lib/utils/codeBlocks';
	import { getMarkdownHeadings, renderMarkdownToHtml } from '$lib/utils/markdown';
	import { editorHtmlToMarkdown } from '$lib/utils/richTextEditor';

	export let value = '';
	export let label = 'Rich text';
	export let placeholder = 'Start writing...';
	export let helpText = 'Supports headings, lists, tables, images, links, and fenced code blocks with languages.';
	export let uploadEndpoint = '/api/cms/uploads';

	const DESKTOP_MEDIA_QUERY = '(min-width: 960px)';
	const IMAGE_URL_PATTERN = /^(https?:\/\/|data:image\/|\/|#|\.\.?\/)/i;

	type EditorTab = 'visual' | 'preview' | 'markdown';
	type MediaInsertMode = 'upload' | 'url';
	type CodeLanguage = 'plaintext' | 'ts' | 'js' | 'python' | 'html' | 'css' | 'json' | 'sql' | 'bash';
	type CompatibleMediaQueryList = MediaQueryList & {
		addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
		removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
	};

	const isFullscreenWorkspace = true;

	let activeTab: EditorTab = 'visual';
	let editorElement: HTMLDivElement | null = null;
	let languagePickerElement: HTMLSelectElement | null = null;
	let fileInputElement: HTMLInputElement | null = null;
	let codeLanguage: CodeLanguage = 'ts';
	let isDesktopLayout =
		typeof window !== 'undefined' && typeof window.matchMedia === 'function'
			? window.matchMedia(DESKTOP_MEDIA_QUERY).matches
			: false;
	let isToolsPanelOpen = isDesktopLayout;
	let isGuidePanelOpen = isDesktopLayout;
	let isMediaPanelOpen = false;
	let mediaInsertMode: MediaInsertMode = 'upload';
	let imageUrl = 'https://';
	let imageAlt = '';
	let imageCaption = '';
	let selectedImageFile: File | null = null;
	let isUploadingImage = false;
	let mediaError = '';
	let isDropTarget = false;
	let savedSelection: Range | null = null;
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
	$: documentOutline = getMarkdownHeadings(value).filter((heading) => heading.level >= 2 && heading.level <= 3);
	$: showFormattingTools = isDesktopLayout || isToolsPanelOpen;
	$: showGuide = isDesktopLayout || isGuidePanelOpen;
	$: selectedLanguageLabel = codeLanguage === 'plaintext' ? 'Plain code' : codeLanguage;
	$: isVisualTab = activeTab === 'visual';

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
			if (typeof desktopMedia.removeEventListener === 'function') {
				desktopMedia.removeEventListener('change', handleResponsiveChange);
			} else {
				desktopMedia.removeListener?.(handleResponsiveChange);
			}
		};
	});

	onDestroy(() => {
		syncDocumentScrollLock(false);
	});

	$: if (activeTab === 'visual') {
		syncEditorFromValue();
	}

	$: syncDocumentScrollLock(isFullscreenWorkspace);

	function saveSelection() {
		if (!editorElement || typeof window === 'undefined') {
			return;
		}

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			return;
		}

		const range = selection.getRangeAt(0);
		if (!editorElement.contains(range.commonAncestorContainer)) {
			return;
		}

		savedSelection = range.cloneRange();
	}

	function restoreSelection() {
		if (!savedSelection || typeof window === 'undefined') {
			return;
		}

		const selection = window.getSelection();
		if (!selection) {
			return;
		}

		selection.removeAllRanges();
		selection.addRange(savedSelection);
	}

	function focusEditor() {
		editorElement?.focus();
		restoreSelection();
	}

	function handleEditorInput() {
		if (!editorElement) {
			return;
		}

		value = editorHtmlToMarkdown(editorElement.innerHTML);
		saveSelection();
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
		savedSelection = nextRange.cloneRange();
		handleEditorInput();
	}

	function insertBlockNode(node: HTMLElement) {
		if (!editorElement || typeof window === 'undefined') {
			return;
		}

		focusEditor();
		const paragraph = document.createElement('p');
		paragraph.append(document.createElement('br'));

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			editorElement.append(node, paragraph);
		} else {
			const range = selection.getRangeAt(0);
			range.deleteContents();
			range.insertNode(paragraph);
			range.insertNode(node);

			selection.removeAllRanges();
			const nextRange = document.createRange();
			nextRange.selectNodeContents(paragraph);
			nextRange.collapse(true);
			selection.addRange(nextRange);
			savedSelection = nextRange.cloneRange();
		}

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
		insertBlockNode(pre);
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
			for (const cellValue of rowValues) {
				const cell = document.createElement('td');
				cell.textContent = cellValue;
				row.append(cell);
			}
			tbody.append(row);
		}

		table.append(thead, tbody);
		insertBlockNode(table);
	}

	function getDefaultImageAlt(source: string): string {
		const stem = source
			.split('/')
			.pop()
			?.replace(/\.[^.]+$/, '')
			.replace(/[-_]+/g, ' ')
			.trim();

		return stem || 'Image';
	}

	function resetMediaState() {
		selectedImageFile = null;
		imageAlt = '';
		imageCaption = '';
		mediaError = '';
		isDropTarget = false;
		if (mediaInsertMode === 'url') {
			imageUrl = 'https://';
		}
		if (fileInputElement) {
			fileInputElement.value = '';
		}
	}

	function openMediaPanel(nextMode: MediaInsertMode = 'upload') {
		saveSelection();
		isMediaPanelOpen = true;
		mediaInsertMode = nextMode;
		mediaError = '';
		if (nextMode === 'url' && !imageUrl.trim()) {
			imageUrl = 'https://';
		}
	}

	function closeMediaPanel() {
		isMediaPanelOpen = false;
		mediaError = '';
		isDropTarget = false;
	}

	function setMediaInsertMode(nextMode: MediaInsertMode) {
		mediaInsertMode = nextMode;
		mediaError = '';
		if (nextMode === 'url' && !imageUrl.trim()) {
			imageUrl = 'https://';
		}
	}

	function insertFigure(src: string, alt: string, caption: string) {
		if (!editorElement) {
			return;
		}

		const figure = document.createElement('figure');
		const image = document.createElement('img');
		image.src = src;
		image.alt = alt;
		if (caption) {
			image.title = caption;
		}
		figure.append(image);

		if (caption) {
			const figcaption = document.createElement('figcaption');
			figcaption.textContent = caption;
			figure.append(figcaption);
		}

		insertBlockNode(figure);
		resetMediaState();
		closeMediaPanel();
	}

	function handleImageFileChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const nextFile = target.files?.[0] ?? null;
		selectedImageFile = nextFile;
		mediaError = '';
		if (nextFile && !imageAlt.trim()) {
			imageAlt = getDefaultImageAlt(nextFile.name);
		}
	}

	function buildUploadErrorMessage(payload: unknown): string {
		if (typeof payload === 'object' && payload && 'message' in payload && typeof payload.message === 'string') {
			return payload.message;
		}

		return 'Unable to upload this image right now.';
	}

	async function uploadImageFile(file: File): Promise<string | null> {
		try {
			isUploadingImage = true;
			mediaError = '';

			const formData = new FormData();
			formData.set('file', file);

			const response = await fetch(uploadEndpoint, {
				method: 'POST',
				body: formData
			});

			let payload: { url?: string; message?: string; } | null = null;
			try {
				payload = await response.json();
			} catch {
				payload = null;
			}

			if (!response.ok) {
				throw new Error(buildUploadErrorMessage(payload));
			}

			if (!payload?.url) {
				throw new Error('Upload response was missing an image URL.');
			}

			return payload.url;
		} catch (error) {
			mediaError = error instanceof Error ? error.message : 'Unable to upload this image right now.';
			return null;
		} finally {
			isUploadingImage = false;
		}
	}

	async function insertUploadedImage() {
		if (!selectedImageFile) {
			mediaError = 'Choose an image file before inserting it.';
			return;
		}

		const uploadedUrl = await uploadImageFile(selectedImageFile);
		if (!uploadedUrl) {
			return;
		}

		insertFigure(uploadedUrl, imageAlt.trim() || getDefaultImageAlt(selectedImageFile.name), imageCaption.trim());
	}

	function insertImageFromUrl() {
		const nextUrl = imageUrl.trim();
		if (!nextUrl || !IMAGE_URL_PATTERN.test(nextUrl)) {
			mediaError = 'Use a valid hosted image URL.';
			return;
		}

		insertFigure(nextUrl, imageAlt.trim() || getDefaultImageAlt(nextUrl), imageCaption.trim());
	}

	async function insertDroppedImage(file: File) {
		selectedImageFile = file;
		imageAlt = imageAlt.trim() || getDefaultImageAlt(file.name);
		const uploadedUrl = await uploadImageFile(file);
		if (!uploadedUrl) {
			isMediaPanelOpen = true;
			mediaInsertMode = 'upload';
			return;
		}

		insertFigure(uploadedUrl, imageAlt.trim() || getDefaultImageAlt(file.name), imageCaption.trim());
	}

	function extractImageFile(files: FileList | File[] | null | undefined): File | null {
		if (!files) {
			return null;
		}

		for (const file of Array.from(files)) {
			if (file.type.startsWith('image/')) {
				return file;
			}
		}

		return null;
	}

	async function handleEditorDrop(event: DragEvent) {
		event.preventDefault();
		isDropTarget = false;
		const file = extractImageFile(event.dataTransfer?.files);
		if (!file) {
			return;
		}

		await insertDroppedImage(file);
	}

	function handleEditorDragOver(event: DragEvent) {
		event.preventDefault();
		if (extractImageFile(event.dataTransfer?.files)) {
			isDropTarget = true;
		}
	}

	function handleEditorDragLeave() {
		isDropTarget = false;
	}

	async function handleEditorPaste(event: ClipboardEvent) {
		const file = extractImageFile(event.clipboardData?.files);
		if (!file) {
			return;
		}

		event.preventDefault();
		await insertDroppedImage(file);
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
			return 'Live canvas';
		}

		if (tab === 'preview') {
			return 'Frontend preview';
		}

		return 'Markdown source';
	}
</script>

<div class="rich-text-editor is-expanded" use:bindEditorKeydown>
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
				<p class="rich-text-editor__hero-note">The canvas mirrors the published article treatment so structure, spacing, and media read closer to the live page.</p>
			</div>
		</div>

		<div class="rich-text-editor__workspace">
			<section class="rich-text-editor__canvas">
				<div class="rich-text-editor__header">
					<div class="rich-text-editor__mode-summary">
						<span class="rich-text-editor__mode-pill">{getVisibleModeLabel(activeTab)}</span>
						<p class="rich-text-editor__mode-description">
							{#if activeTab === 'visual'}
								Write directly into the article stage with responsive spacing, media, and code treatment.
							{:else if activeTab === 'preview'}
								Review the rendered article without editing chrome.
							{:else}
								Drop to source when you need exact markdown control.
							{/if}
						</p>
						{#if !isDesktopLayout}
							<span class="rich-text-editor__mode-note">Formatting tools, uploads, and the guide stay collapsible on smaller screens.</span>
						{/if}
					</div>

					<div class="rich-text-editor__workspace-controls">
						<div class="rich-text-editor__tabs" role="tablist" aria-label={`${label} editor views`}>
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
								<button
									type="button"
									class="rich-text-editor__panel-toggle"
									aria-controls={`${editorInstanceId}-guide`}
									aria-expanded={showGuide}
									on:click={toggleGuidePanel}
								>
									{showGuide ? 'Hide writing guide' : 'Show writing guide'}
								</button>
							</div>
						{/if}
					</div>

				</div>

				{#if isVisualTab}
					<div class="rich-text-editor__visual-workspace">
						<div class="rich-text-editor__editor-shell" class:is-drop-target={isDropTarget}>
							<div class="rich-text-editor__surface-frame">
								<div class="rich-text-editor__surface-header">
									<div class="rich-text-editor__surface-meta">Live article canvas</div>
									<p class="rich-text-editor__surface-note">Drop images straight into the editor, paste screenshots, or switch to markdown for exact syntax control.</p>
								</div>
								<div class="rich-text-editor__surface-stage">
									<div class="rich-text-editor__surface-inner">
										<div
											bind:this={editorElement}
											class="rich-text-editor__surface rich-text-editor__article-surface cms-content"
											role="textbox"
											tabindex="0"
											aria-multiline="true"
											aria-label={`${label} visual editor`}
											contenteditable="true"
											data-placeholder={placeholder}
											on:input={handleEditorInput}
											on:mouseup={saveSelection}
											on:keyup={saveSelection}
											on:focus={saveSelection}
											on:drop={handleEditorDrop}
											on:dragover={handleEditorDragOver}
											on:dragleave={handleEditorDragLeave}
											on:paste={handleEditorPaste}
										></div>
									</div>
								</div>
							</div>
						</div>

						{#if !isDesktopLayout}
							<div class="rich-text-editor__quick-inserts" aria-label="Quick insert actions">
								<button type="button" class="rich-text-editor__quick-insert" aria-label="Quick insert image" on:click={() => openMediaPanel('upload')}>
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

						{#if isMediaPanelOpen && !showFormattingTools}
							<section class="rich-text-editor__media-studio" aria-label="Image studio">
								<div class="rich-text-editor__media-studio-header">
									<div>
										<h4>Image studio</h4>
										<p>Bring the editorial surface closer to the published article with uploads, captions, and responsive imagery.</p>
									</div>
									<button type="button" class="rich-text-editor__panel-toggle" on:click={closeMediaPanel}>Close</button>
								</div>

								<div class="rich-text-editor__media-mode-switch">
									<button
										type="button"
										class="rich-text-editor__tab"
										class:is-active={mediaInsertMode === 'upload'}
										on:click={() => setMediaInsertMode('upload')}
									>
										Upload
									</button>
									<button
										type="button"
										class="rich-text-editor__tab"
										class:is-active={mediaInsertMode === 'url'}
										on:click={() => setMediaInsertMode('url')}
										aria-label="Use image URL"
									>
										Use image URL
									</button>
								</div>

								<div class="rich-text-editor__media-grid">
									{#if mediaInsertMode === 'upload'}
										<label class="rich-text-editor__dropzone" class:is-drag-target={isDropTarget}>
											<span class="rich-text-editor__dropzone-title">Upload image file</span>
											<span class="rich-text-editor__dropzone-copy">
												{#if selectedImageFile}
													Ready to upload {selectedImageFile.name}.
												{:else}
													Drop a screenshot, paste an image, or browse from disk.
												{/if}
											</span>
											<input
												bind:this={fileInputElement}
												class="rich-text-editor__sr-only"
												type="file"
												accept="image/*"
												aria-label="Upload image file"
												on:change={handleImageFileChange}
											/>
										</label>
									{:else}
										<label class="rich-text-editor__field">
											<span>Image URL</span>
											<input aria-label="Image URL" type="url" bind:value={imageUrl} placeholder="https://example.com/image.png" />
										</label>
									{/if}

									<label class="rich-text-editor__field">
										<span>Image alt text</span>
										<input aria-label="Image alt text" type="text" bind:value={imageAlt} placeholder="Describe what the reader needs to understand" />
									</label>

									<label class="rich-text-editor__field">
										<span>Image caption</span>
										<input aria-label="Image caption" type="text" bind:value={imageCaption} placeholder="Optional caption shown under the image" />
									</label>
								</div>

								<div class="rich-text-editor__media-actions">
									<p class="rich-text-editor__media-status">
										{#if mediaInsertMode === 'upload'}
											Upload to the CMS media endpoint, then insert the responsive markdown image block.
										{:else}
											Use a hosted image URL when the asset already lives on your CDN or external docs host.
										{/if}
									</p>
									<div class="rich-text-editor__media-buttons">
										<button type="button" class="rich-text-editor__panel-toggle" on:click={resetMediaState}>Reset</button>
										{#if mediaInsertMode === 'upload'}
											<button type="button" class="rich-text-editor__expand" on:click={() => void insertUploadedImage()} disabled={isUploadingImage}>
												{isUploadingImage ? 'Uploading image...' : 'Insert uploaded image'}
											</button>
										{:else}
											<button type="button" class="rich-text-editor__expand" on:click={insertImageFromUrl}>Insert image from URL</button>
										{/if}
									</div>
								</div>

								{#if mediaError}
									<p class="rich-text-editor__media-error" role="alert">{mediaError}</p>
								{/if}
							</section>
						{/if}

						{#if showFormattingTools}
							<aside class="rich-text-editor__tools-column" id={`${editorInstanceId}-tools`}>
								<section class="rich-text-editor__tool-panel">
									<div class="rich-text-editor__tool-panel-header">
										<h4>Formatting</h4>
										<p>Shape the article without leaving the canvas.</p>
									</div>
									<div class="rich-text-editor__toolbar" role="toolbar" aria-label={`${label} formatting toolbar`}>
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
									</div>
								</section>

								<section class="rich-text-editor__tool-panel rich-text-editor__tool-panel--inserts">
									<div class="rich-text-editor__tool-panel-header">
										<h4>Insert blocks</h4>
										<p>Add the pieces that usually matter in guides.</p>
									</div>
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
									<div class="rich-text-editor__insert-actions">
										<button type="button" class="rich-text-editor__panel-toggle" on:click={insertCodeBlock} aria-label="Code block">Code block</button>
										<button type="button" class="rich-text-editor__panel-toggle" on:click={() => openMediaPanel('upload')} aria-label="Insert image">Insert image</button>
										<button type="button" class="rich-text-editor__panel-toggle" on:click={insertTable} aria-label="Insert table">Insert table</button>
									</div>
									<div class="rich-text-editor__quick-actions">
										<button type="button" class="rich-text-editor__quick-card" on:click={() => openMediaPanel('upload')}>
											<strong>Image studio</strong>
											<span>Upload or paste imagery with alt text and captions.</span>
										</button>
										<button type="button" class="rich-text-editor__quick-card" on:click={insertTable} aria-label="Add table block">
											<strong>Table block</strong>
											<span>Drop in a comparison table and refine it in markdown if needed.</span>
										</button>
										<button type="button" class="rich-text-editor__quick-card" on:click={insertCodeBlock} aria-label="Add code snippet block">
											<strong>Snippet block</strong>
											<span>Insert a snippet using the selected language.</span>
										</button>
									</div>
								</section>

								{#if isMediaPanelOpen}
									<section class="rich-text-editor__media-studio" aria-label="Image studio">
							<div class="rich-text-editor__media-studio-header">
								<div>
									<h4>Image studio</h4>
									<p>Bring the editorial surface closer to the published article with uploads, captions, and responsive imagery.</p>
								</div>
								<button type="button" class="rich-text-editor__panel-toggle" on:click={closeMediaPanel}>Close</button>
							</div>

							<div class="rich-text-editor__media-mode-switch">
								<button
									type="button"
									class="rich-text-editor__tab"
									class:is-active={mediaInsertMode === 'upload'}
									on:click={() => setMediaInsertMode('upload')}
								>
									Upload
								</button>
								<button
									type="button"
									class="rich-text-editor__tab"
									class:is-active={mediaInsertMode === 'url'}
									on:click={() => setMediaInsertMode('url')}
									aria-label="Use image URL"
								>
									Use image URL
								</button>
							</div>

							<div class="rich-text-editor__media-grid">
								{#if mediaInsertMode === 'upload'}
									<label class="rich-text-editor__dropzone" class:is-drag-target={isDropTarget}>
										<span class="rich-text-editor__dropzone-title">Upload image file</span>
										<span class="rich-text-editor__dropzone-copy">
											{#if selectedImageFile}
												Ready to upload {selectedImageFile.name}.
											{:else}
												Drop a screenshot, paste an image, or browse from disk.
											{/if}
										</span>
										<input
											bind:this={fileInputElement}
											class="rich-text-editor__sr-only"
											type="file"
											accept="image/*"
											aria-label="Upload image file"
											on:change={handleImageFileChange}
										/>
									</label>
								{:else}
									<label class="rich-text-editor__field">
										<span>Image URL</span>
										<input aria-label="Image URL" type="url" bind:value={imageUrl} placeholder="https://example.com/image.png" />
									</label>
								{/if}

								<label class="rich-text-editor__field">
									<span>Image alt text</span>
									<input aria-label="Image alt text" type="text" bind:value={imageAlt} placeholder="Describe what the reader needs to understand" />
								</label>

								<label class="rich-text-editor__field">
									<span>Image caption</span>
									<input aria-label="Image caption" type="text" bind:value={imageCaption} placeholder="Optional caption shown under the image" />
								</label>
							</div>

							<div class="rich-text-editor__media-actions">
								<p class="rich-text-editor__media-status">
									{#if mediaInsertMode === 'upload'}
										Upload to the CMS media endpoint, then insert the responsive markdown image block.
									{:else}
										Use a hosted image URL when the asset already lives on your CDN or external docs host.
									{/if}
								</p>
								<div class="rich-text-editor__media-buttons">
									<button type="button" class="rich-text-editor__panel-toggle" on:click={resetMediaState}>Reset</button>
									{#if mediaInsertMode === 'upload'}
										<button type="button" class="rich-text-editor__expand" on:click={() => void insertUploadedImage()} disabled={isUploadingImage}>
											{isUploadingImage ? 'Uploading image...' : 'Insert uploaded image'}
										</button>
									{:else}
										<button type="button" class="rich-text-editor__expand" on:click={insertImageFromUrl}>Insert image from URL</button>
									{/if}
								</div>
							</div>

							{#if mediaError}
								<p class="rich-text-editor__media-error" role="alert">{mediaError}</p>
							{/if}
									</section>
								{/if}
							</aside>
						{/if}
					</div>
				{:else if activeTab === 'preview'}
					<div class="rich-text-editor__preview-shell">
						<div class="rich-text-editor__surface-frame">
							<div class="rich-text-editor__surface-header">
								<div class="rich-text-editor__surface-meta">Public article preview</div>
								<p class="rich-text-editor__surface-note">Read the rendered article without the editing controls.</p>
							</div>
							<div class="rich-text-editor__surface-stage">
								<div class="rich-text-editor__surface-inner">
									<div class="rich-text-editor__preview cms-content" aria-label={`${label} preview`} use:enhanceCodeBlocks>
										{#if previewHtml}
											{@html previewHtml}
										{:else}
											<p class="rich-text-editor__empty">Nothing to preview yet.</p>
										{/if}
									</div>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="rich-text-editor__preview-shell">
						<div class="rich-text-editor__surface-frame">
							<div class="rich-text-editor__surface-header">
								<div class="rich-text-editor__surface-meta">Markdown source</div>
								<p class="rich-text-editor__surface-note">Edit the raw source when you need exact spacing, nesting, or fence syntax.</p>
							</div>
							<div class="rich-text-editor__surface-stage">
								<textarea
									class="rich-text-editor__source"
									aria-label={`${label} markdown source`}
									rows="12"
									value={value}
									on:input={handleMarkdownInput}
								></textarea>
							</div>
						</div>
					</div>
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
							<span>{selectedLanguageLabel}</span>
						</div>
					</section>
					<section class="rich-text-editor__panel">
						<h4>Document outline</h4>
						{#if documentOutline.length > 0}
							<ul class="rich-text-editor__outline">
								{#each documentOutline as heading}
									<li class:sub-item={heading.level === 3}>{heading.text}</li>
								{/each}
							</ul>
						{:else}
							<p>Add H2 and H3 headings to build a stronger reading spine and table of contents.</p>
						{/if}
					</section>
					<section class="rich-text-editor__panel">
						<h4>Keyboard hints</h4>
						<p>Use Ctrl/Cmd+B for bold, Ctrl/Cmd+I for italic, and Ctrl/Cmd+K for links.</p>
					</section>
				</aside>
			{/if}
		</div>
	</div>

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
		overflow-y: auto;
		background:
			radial-gradient(circle at top left, color-mix(in srgb, var(--color-primary) 15%, var(--color-background)) 0%, transparent 36%),
			linear-gradient(160deg, var(--color-background) 0%, var(--color-surface) 52%, var(--color-background) 100%);
	}

	.rich-text-editor__shell {
		display: grid;
		gap: var(--spacing-md);
		padding: var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		background:
			linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 92%, var(--color-background)) 0%, var(--color-background) 100%);
		box-shadow: var(--shadow-lg);
	}

	.rich-text-editor.is-expanded .rich-text-editor__shell {
		min-height: calc(100dvh - (var(--spacing-xs) * 2));
		padding: var(--spacing-sm);
		box-shadow: var(--shadow-xl);
		grid-template-rows: auto minmax(0, 1fr);
	}

	.rich-text-editor__hero {
		display: grid;
		gap: var(--spacing-md);
		padding: var(--spacing-sm);
		border: 1px solid color-mix(in srgb, var(--color-border) 84%, var(--color-background));
		border-radius: var(--radius-lg);
		background:
			linear-gradient(135deg, color-mix(in srgb, var(--color-background) 92%, var(--color-surface)) 0%, color-mix(in srgb, var(--color-surface) 86%, var(--color-background)) 100%);
	}

	.rich-text-editor__hero-copy {
		display: grid;
		gap: var(--spacing-xs);
		max-width: 44rem;
	}

	.rich-text-editor__hero-copy h3 {
		font-size: 1.4rem;
		line-height: 1.15;
	}

	.rich-text-editor__hero-copy p,
	.rich-text-editor__hero-note,
	.rich-text-editor__mode-description,
	.rich-text-editor__mode-note,
	.rich-text-editor__empty,
	.rich-text-editor__surface-note,
	.rich-text-editor__panel p,
	.rich-text-editor__media-status {
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
		max-width: 28rem;
	}

	.rich-text-editor__hero-note,
	.rich-text-editor__mode-description,
	.rich-text-editor__surface-note {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.rich-text-editor__metrics,
	.rich-text-editor__chips {
		display: flex;
		gap: var(--spacing-xs);
		flex-wrap: wrap;
	}

	.rich-text-editor__metrics span,
	.rich-text-editor__chips span,
	.rich-text-editor__surface-meta {
		padding: var(--spacing-xs) var(--spacing-sm);
		border: 1px solid color-mix(in srgb, var(--color-border) 86%, var(--color-background));
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-background) 82%, var(--color-surface));
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__expand,
	.rich-text-editor__panel-toggle,
	.rich-text-editor__tab,
	.rich-text-editor__quick-insert,
	.rich-text-editor__toolbar button,
	.rich-text-editor__quick-card,
	.rich-text-editor__language-picker select,
	.rich-text-editor__dropzone {
		appearance: none;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		border-radius: var(--radius-md);
		padding: var(--spacing-xs) var(--spacing-sm);
		font: inherit;
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast),
			transform var(--transition-fast),
			box-shadow var(--transition-fast);
	}

	.rich-text-editor__expand {
		width: 100%;
		padding: 0.8rem 1rem;
		border-color: color-mix(in srgb, var(--color-primary) 60%, var(--color-border));
		background: linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 78%, var(--color-secondary)) 100%);
		color: var(--color-background);
		font-weight: 700;
		box-shadow: var(--shadow-sm);
	}

	.rich-text-editor__panel-toggle,
	.rich-text-editor__quick-insert {
		font-weight: 600;
		text-align: left;
		cursor: pointer;
	}

	.rich-text-editor__quick-insert {
		text-align: center;
		padding-block: 0.72rem;
	}

	.rich-text-editor__toolbar button,
	.rich-text-editor__tab,
	.rich-text-editor__quick-card {
		cursor: pointer;
	}

	.rich-text-editor__workspace,
	.rich-text-editor__canvas,
	.rich-text-editor__visual-workspace,
	.rich-text-editor__tools-column,
	.rich-text-editor__workspace-controls,
	.rich-text-editor__preview-shell,
	.rich-text-editor__editor-shell {
		display: grid;
		gap: var(--spacing-md);
		min-height: 0;
	}

	.rich-text-editor__editor-shell {
		order: 1;
	}

	.rich-text-editor__quick-inserts {
		order: 2;
	}

	.rich-text-editor__tools-column,
	.rich-text-editor__media-studio,
	.rich-text-editor__sidebar {
		order: 3;
	}

	.rich-text-editor__workspace,
	.rich-text-editor__canvas {
		grid-template-rows: auto minmax(0, 1fr);
	}

	.rich-text-editor.is-expanded .rich-text-editor__canvas {
		grid-template-rows: auto minmax(0, 1fr);
	}

	.rich-text-editor__header {
		display: grid;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		border: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--color-background));
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-background) 86%, var(--color-surface));
	}

	.rich-text-editor.is-expanded .rich-text-editor__header {
		position: sticky;
		top: 0;
		z-index: 2;
		backdrop-filter: blur(16px);
	}

	.rich-text-editor__mode-summary {
		display: grid;
		gap: 0.35rem;
	}

	.rich-text-editor__mode-pill {
		width: fit-content;
		padding: 0.35rem 0.65rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 86%, var(--color-background));
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-surface) 90%, var(--color-background));
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__panel-toggles,
	.rich-text-editor__insert-actions,
	.rich-text-editor__quick-inserts,
	.rich-text-editor__media-buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--spacing-xs);
	}

	.rich-text-editor__quick-inserts {
		grid-template-columns: repeat(3, minmax(0, 1fr));
		position: sticky;
		bottom: calc(env(safe-area-inset-bottom, 0px) + var(--spacing-xs));
		z-index: 3;
		padding: 0.45rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--color-background));
		border-radius: calc(var(--radius-lg) + 0.15rem);
		background: color-mix(in srgb, var(--color-background) 90%, var(--color-surface));
		box-shadow: var(--shadow-lg);
		backdrop-filter: blur(18px);
	}

	.rich-text-editor__tabs,
	.rich-text-editor__toolbar,
	.rich-text-editor__media-mode-switch {
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
		border: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--color-background));
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-surface) 94%, var(--color-background));
	}

	.rich-text-editor__panel-toggle:hover,
	.rich-text-editor__tab:hover,
	.rich-text-editor__tab.is-active,
	.rich-text-editor__quick-insert:hover,
	.rich-text-editor__toolbar button:hover,
	.rich-text-editor__quick-card:hover,
	.rich-text-editor__panel-toggle[aria-expanded='true'],
	.rich-text-editor__dropzone:hover {
		background: color-mix(in srgb, var(--color-surface-hover) 82%, var(--color-background));
		border-color: color-mix(in srgb, var(--color-primary) 44%, var(--color-border));
		transform: translateY(-1px);
	}

	.rich-text-editor__language-picker {
		display: grid;
		gap: 0.2rem;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__quick-actions {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-xs);
	}

	.rich-text-editor__quick-card {
		display: grid;
		gap: 0.35rem;
		text-align: left;
		padding: 0.95rem 1rem;
		background: linear-gradient(180deg, color-mix(in srgb, var(--color-background) 96%, var(--color-surface)) 0%, color-mix(in srgb, var(--color-surface) 94%, var(--color-background)) 100%);
	}

	.rich-text-editor__quick-card strong,
	.rich-text-editor__panel h4,
	.rich-text-editor__media-studio-header h4 {
		font-size: 0.96rem;
	}

	.rich-text-editor__quick-card span,
	.rich-text-editor__dropzone-copy,
	.rich-text-editor__outline,
	.rich-text-editor__media-studio-header p {
		font-size: 0.84rem;
		line-height: 1.5;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__media-studio,
	.rich-text-editor__panel,
	.rich-text-editor__tool-panel,
	.rich-text-editor__surface-frame,
	.rich-text-editor__preview,
	.rich-text-editor__surface,
	.rich-text-editor__source {
		border: 1px solid color-mix(in srgb, var(--color-border) 84%, var(--color-background));
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-background) 94%, var(--color-surface));
		box-shadow: var(--shadow-sm);
	}

	.rich-text-editor__media-studio,
	.rich-text-editor__panel,
	.rich-text-editor__tool-panel,
	.rich-text-editor__surface-frame {
		padding: var(--spacing-md);
	}

	.rich-text-editor__tool-panel,
	.rich-text-editor__surface-frame {
		display: grid;
		gap: var(--spacing-sm);
	}

	.rich-text-editor__visual-workspace {
		align-content: start;
	}

	.rich-text-editor__tool-panel-header {
		display: grid;
		gap: 0.25rem;
	}

	.rich-text-editor__tool-panel-header h4 {
		font-size: 0.92rem;
	}

	.rich-text-editor__tool-panel-header p {
		margin: 0;
		font-size: 0.84rem;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__media-studio {
		display: grid;
		gap: var(--spacing-md);
		background:
			linear-gradient(145deg, color-mix(in srgb, var(--color-primary) 6%, var(--color-surface)) 0%, color-mix(in srgb, var(--color-background) 94%, var(--color-surface)) 100%);
	}

	.rich-text-editor__surface-frame {
		grid-template-rows: auto minmax(0, 1fr);
		min-height: 0;
		background:
			linear-gradient(180deg, color-mix(in srgb, var(--color-background) 96%, var(--color-surface)) 0%, color-mix(in srgb, var(--color-surface) 94%, var(--color-background)) 100%);
	}

	.rich-text-editor__surface-header {
		display: grid;
		gap: 0.4rem;
		padding-bottom: var(--spacing-xs);
		border-bottom: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--color-background));
	}

	.rich-text-editor__surface-stage {
		min-height: 0;
		max-height: min(62dvh, 44rem);
		overflow: auto;
		padding: clamp(var(--spacing-xs), 1.6vw, var(--spacing-md));
		border-radius: calc(var(--radius-lg) - 0.25rem);
		background:
			radial-gradient(circle at top, color-mix(in srgb, var(--color-primary) 8%, transparent) 0%, transparent 45%),
			linear-gradient(180deg, color-mix(in srgb, var(--color-background) 98%, var(--color-surface)) 0%, color-mix(in srgb, var(--color-surface) 95%, var(--color-background)) 100%);
	}

	.rich-text-editor__surface-inner {
		width: min(100%, 96rem);
		margin: 0 auto;
	}

	@media (max-width: 959px) {
		.rich-text-editor.is-expanded {
			padding: 0;
		}

		.rich-text-editor.is-expanded .rich-text-editor__shell {
			min-height: 100dvh;
			padding: 0.75rem;
			border-radius: 0;
			border-left: none;
			border-right: none;
		}

		.rich-text-editor__hero {
			gap: 0.6rem;
			padding: 0.85rem;
		}

		.rich-text-editor__hero-copy h3 {
			font-size: 1.2rem;
		}

		.rich-text-editor__hero-note,
		.rich-text-editor__mode-description,
		.rich-text-editor__surface-note {
			font-size: 0.82rem;
			line-height: 1.45;
		}

		.rich-text-editor__workspace,
		.rich-text-editor__canvas,
		.rich-text-editor__visual-workspace {
			gap: 0.75rem;
		}

		.rich-text-editor__header,
		.rich-text-editor__surface-frame,
		.rich-text-editor__tool-panel,
		.rich-text-editor__panel,
		.rich-text-editor__media-studio {
			padding: 0.85rem;
		}

		.rich-text-editor__tabs {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			overflow: visible;
		}

		.rich-text-editor__tab {
			text-align: center;
			justify-content: center;
		}

		.rich-text-editor__panel-toggles {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.rich-text-editor__surface-stage {
			max-height: min(58dvh, 38rem);
			scroll-padding-bottom: 5rem;
		}

		.rich-text-editor__surface,
		.rich-text-editor__preview,
		.rich-text-editor__source {
			padding: 1.05rem;
		}

		.rich-text-editor__article-surface,
		.rich-text-editor__preview.cms-content {
			width: 100%;
			font-size: 0.98rem;
			line-height: 1.75;
		}

		.rich-text-editor__insert-actions,
		.rich-text-editor__media-buttons {
			grid-template-columns: 1fr;
		}

		.rich-text-editor__toolbar {
			display: grid;
			gap: var(--spacing-xs);
		}

		.rich-text-editor__group {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.rich-text-editor__toolbar button,
		.rich-text-editor__panel-toggle,
		.rich-text-editor__quick-insert,
		.rich-text-editor__expand {
			min-height: 2.75rem;
		}

		.rich-text-editor__sidebar {
			padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 4.75rem);
		}
	}

	.rich-text-editor__media-studio-header,
	.rich-text-editor__media-actions {
		display: grid;
		gap: var(--spacing-sm);
	}

	.rich-text-editor__media-grid {
		display: grid;
		gap: var(--spacing-sm);
	}

	.rich-text-editor__field {
		display: grid;
		gap: 0.35rem;
		font-size: 0.85rem;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__field input {
		width: 100%;
	}

	.rich-text-editor__dropzone {
		display: grid;
		gap: 0.35rem;
		padding: var(--spacing-lg);
		border-style: dashed;
		cursor: pointer;
		text-align: left;
	}

	.rich-text-editor__dropzone.is-drag-target,
	.rich-text-editor__editor-shell.is-drop-target .rich-text-editor__surface {
		border-color: color-mix(in srgb, var(--color-primary) 60%, var(--color-border));
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 12%, transparent);
	}

	.rich-text-editor__dropzone-title,
	.rich-text-editor__surface-meta {
		font-weight: 700;
	}

	.rich-text-editor__media-error {
		margin: 0;
		padding: 0.75rem 0.9rem;
		border: 1px solid color-mix(in srgb, var(--color-error) 34%, var(--color-border));
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-error) 10%, var(--color-background));
		color: color-mix(in srgb, var(--color-error) 88%, var(--color-text));
		font-size: 0.9rem;
	}

	.rich-text-editor__surface,
	.rich-text-editor__preview,
	.rich-text-editor__source {
		min-height: 18rem;
		padding: clamp(var(--spacing-md), 3vw, var(--spacing-xl));
		color: var(--color-text);
	}

	.rich-text-editor.is-expanded .rich-text-editor__surface,
	.rich-text-editor.is-expanded .rich-text-editor__preview,
	.rich-text-editor.is-expanded .rich-text-editor__source {
		min-height: 0;
		height: 100%;
	}

	.rich-text-editor__surface,
	.rich-text-editor__source {
		outline: none;
	}

	.rich-text-editor__surface:focus,
	.rich-text-editor__source:focus {
		border-color: color-mix(in srgb, var(--color-primary) 50%, var(--color-border));
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 14%, transparent);
	}

	.rich-text-editor__surface:empty::before {
		content: attr(data-placeholder);
		color: var(--color-text-secondary);
	}

	.rich-text-editor__source {
		width: 100%;
		min-height: 26rem;
		resize: none;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		line-height: 1.7;
	}

	.rich-text-editor__article-surface,
	.rich-text-editor__preview.cms-content {
		width: min(100%, 88rem);
		max-width: 100%;
		background:
			linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 82%, var(--color-background)) 0%, color-mix(in srgb, var(--color-background) 92%, var(--color-surface)) 100%),
			var(--color-background);
		font-size: 1.02rem;
		line-height: 1.85;
		letter-spacing: 0.002em;
	}

	.rich-text-editor__article-surface :global(> :first-child),
	.rich-text-editor__preview.cms-content :global(> :first-child) {
		margin-top: 0;
	}

	.rich-text-editor__article-surface :global(> :last-child),
	.rich-text-editor__preview.cms-content :global(> :last-child) {
		margin-bottom: 0;
	}

	.rich-text-editor__article-surface :global(h2),
	.rich-text-editor__preview.cms-content :global(h2) {
		font-size: clamp(1.6rem, 2.3vw, 2.3rem);
		font-weight: 700;
		line-height: 1.12;
		letter-spacing: -0.03em;
		margin: clamp(var(--spacing-xl), 4vw, 3rem) 0 var(--spacing-md);
		max-width: 16ch;
	}

	.rich-text-editor__article-surface :global(h3),
	.rich-text-editor__preview.cms-content :global(h3) {
		font-size: clamp(1.25rem, 1.9vw, 1.6rem);
		font-weight: 700;
		line-height: 1.2;
		margin: clamp(var(--spacing-lg), 3vw, 2rem) 0 var(--spacing-sm);
	}

	.rich-text-editor__article-surface :global(p),
	.rich-text-editor__preview.cms-content :global(p) {
		margin-bottom: 1.1rem;
		max-width: 72ch;
	}

	.rich-text-editor__article-surface :global(a),
	.rich-text-editor__preview.cms-content :global(a) {
		text-decoration: underline;
		text-decoration-thickness: 0.08em;
		text-underline-offset: 0.16em;
	}

	.rich-text-editor__article-surface :global(ul),
	.rich-text-editor__article-surface :global(ol),
	.rich-text-editor__preview.cms-content :global(ul),
	.rich-text-editor__preview.cms-content :global(ol) {
		margin: 0 0 var(--spacing-lg);
		padding-left: 1.55em;
	}

	.rich-text-editor__article-surface :global(li),
	.rich-text-editor__preview.cms-content :global(li) {
		margin-bottom: 0.65em;
	}

	.rich-text-editor__article-surface :global(blockquote),
	.rich-text-editor__preview.cms-content :global(blockquote) {
		margin: clamp(var(--spacing-lg), 3vw, var(--spacing-2xl)) 0;
		padding: var(--spacing-lg);
		border-left: 4px solid color-mix(in srgb, var(--color-primary) 50%, var(--color-border));
		border-radius: 0 1.25rem 1.25rem 0;
		background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
	}

	.rich-text-editor__article-surface :global(code),
	.rich-text-editor__preview.cms-content :global(code) {
		font-family: var(--font-mono);
		font-size: 0.875em;
		background-color: color-mix(in srgb, var(--color-surface) 92%, var(--color-background));
		padding: 0.125em 0.375em;
		border-radius: var(--radius-sm);
	}

	.rich-text-editor__article-surface :global(pre),
	.rich-text-editor__preview.cms-content :global(pre) {
		margin: clamp(var(--spacing-lg), 3vw, var(--spacing-2xl)) 0;
		padding: clamp(var(--spacing-lg), 2.5vw, 2rem);
		border-radius: 1.25rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 88%, var(--color-background));
		background: color-mix(in srgb, var(--color-surface) 92%, var(--color-background));
		overflow-x: auto;
	}

	.rich-text-editor__article-surface :global(.cms-code-block),
	.rich-text-editor__preview.cms-content :global(.cms-code-block) {
		margin: clamp(var(--spacing-lg), 3vw, var(--spacing-2xl)) 0;
	}

	.rich-text-editor__article-surface :global(.cms-code-block-toolbar),
	.rich-text-editor__preview.cms-content :global(.cms-code-block-toolbar) {
		padding: 0.8rem 1rem;
	}

	.rich-text-editor__article-surface :global(.cms-code-block pre),
	.rich-text-editor__preview.cms-content :global(.cms-code-block pre) {
		margin: 0;
		padding: clamp(var(--spacing-lg), 2.5vw, 2rem);
		background: transparent;
		border: none;
		box-shadow: none;
	}

	.rich-text-editor__article-surface :global(pre code),
	.rich-text-editor__preview.cms-content :global(pre code) {
		background: none;
		padding: 0;
	}

	.rich-text-editor__article-surface :global(.cms-code-block code),
	.rich-text-editor__preview.cms-content :global(.cms-code-block code) {
		display: block;
		color: var(--color-code-text);
	}

	.rich-text-editor__article-surface :global(.token.keyword),
	.rich-text-editor__preview.cms-content :global(.token.keyword) {
		color: var(--color-code-keyword);
	}

	.rich-text-editor__article-surface :global(.token.string),
	.rich-text-editor__preview.cms-content :global(.token.string) {
		color: var(--color-code-string);
	}

	.rich-text-editor__article-surface :global(.token.boolean),
	.rich-text-editor__preview.cms-content :global(.token.boolean) {
		color: var(--color-code-boolean);
	}

	.rich-text-editor__article-surface :global(.token.number),
	.rich-text-editor__preview.cms-content :global(.token.number) {
		color: var(--color-code-number);
	}

	.rich-text-editor__article-surface :global(.token.comment),
	.rich-text-editor__preview.cms-content :global(.token.comment) {
		color: var(--color-code-comment);
	}

	.rich-text-editor__article-surface :global(.token.tag),
	.rich-text-editor__preview.cms-content :global(.token.tag) {
		color: var(--color-code-tag);
	}

	.rich-text-editor__article-surface :global(.token.attr-name),
	.rich-text-editor__preview.cms-content :global(.token.attr-name) {
		color: var(--color-code-attribute);
	}

	.rich-text-editor__article-surface :global(.token.punctuation),
	.rich-text-editor__preview.cms-content :global(.token.punctuation) {
		color: var(--color-code-punctuation);
	}

	.rich-text-editor__article-surface :global(figure),
	.rich-text-editor__preview.cms-content :global(figure) {
		display: grid;
		gap: var(--spacing-sm);
		margin: clamp(var(--spacing-lg), 3vw, var(--spacing-2xl)) 0;
	}

	.rich-text-editor__article-surface :global(img),
	.rich-text-editor__preview.cms-content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 1.25rem;
		box-shadow: var(--shadow-md);
	}

	.rich-text-editor__article-surface :global(figcaption),
	.rich-text-editor__preview.cms-content :global(figcaption) {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__article-surface :global(table),
	.rich-text-editor__preview.cms-content :global(table) {
		width: 100%;
		margin: clamp(var(--spacing-lg), 3vw, var(--spacing-2xl)) 0;
		border-collapse: collapse;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--color-border) 88%, var(--color-background));
		border-radius: 1.1rem;
		background: color-mix(in srgb, var(--color-surface) 84%, var(--color-background));
	}

	.rich-text-editor__article-surface :global(th),
	.rich-text-editor__article-surface :global(td),
	.rich-text-editor__preview.cms-content :global(th),
	.rich-text-editor__preview.cms-content :global(td) {
		padding: 0.9rem 1rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-border) 88%, var(--color-background));
		text-align: left;
		vertical-align: top;
	}

	.rich-text-editor__article-surface :global(th),
	.rich-text-editor__preview.cms-content :global(th) {
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
		background: color-mix(in srgb, var(--color-background) 65%, var(--color-surface));
	}

	.rich-text-editor__article-surface :global(tr:last-child td),
	.rich-text-editor__preview.cms-content :global(tr:last-child td) {
		border-bottom: none;
	}

	.rich-text-editor__article-surface :global(hr),
	.rich-text-editor__preview.cms-content :global(hr) {
		margin: clamp(var(--spacing-xl), 4vw, 4rem) 0;
		border: none;
		height: 1px;
		background: linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--color-border) 100%, var(--color-primary)) 20%, color-mix(in srgb, var(--color-border) 100%, var(--color-primary)) 80%, transparent 100%);
	}

	.rich-text-editor__sidebar {
		display: grid;
		gap: var(--spacing-sm);
		align-content: start;
	}

	.rich-text-editor__outline {
		list-style: none;
		display: grid;
		gap: 0.55rem;
		margin: 0;
		padding: 0;
	}

	.rich-text-editor__outline li.sub-item {
		padding-left: 0.9rem;
	}

	.rich-text-editor__sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (min-width: 960px) {
		.rich-text-editor.is-expanded {
			padding: var(--spacing-lg);
		}

		.rich-text-editor.is-expanded .rich-text-editor__shell {
			min-height: calc(100dvh - (var(--spacing-lg) * 2));
			padding: var(--spacing-lg);
		}

		.rich-text-editor__hero {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: start;
			padding: var(--spacing-md);
		}

		.rich-text-editor__mode-summary {
			grid-template-columns: auto minmax(0, 1fr);
			align-items: start;
		}

		.rich-text-editor__hero-actions {
			justify-items: end;
		}

		.rich-text-editor__tabs,
		.rich-text-editor__media-mode-switch {
			flex-wrap: wrap;
			overflow: visible;
		}

		.rich-text-editor__surface,
		.rich-text-editor__preview,
		.rich-text-editor__source {
			min-height: 24rem;
		}

		.rich-text-editor.is-expanded .rich-text-editor__workspace {
			grid-template-columns: minmax(0, 1fr) 18rem;
		}

		.rich-text-editor__visual-workspace {
			grid-template-columns: 17.5rem minmax(0, 1fr);
			align-items: start;
		}

		.rich-text-editor__tools-column {
			order: 1;
		}

		.rich-text-editor__editor-shell {
			order: 2;
		}

		.rich-text-editor__tools-column,
		.rich-text-editor__sidebar {
			position: sticky;
			top: 0;
		}

		.rich-text-editor__toolbar {
			display: grid;
			gap: var(--spacing-xs);
		}

		.rich-text-editor__group {
			align-items: center;
		}

		.rich-text-editor__editor-shell,
		.rich-text-editor__preview-shell {
			min-height: 0;
		}

		.rich-text-editor__media-studio-header,
		.rich-text-editor__media-actions {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: start;
		}

		.rich-text-editor__media-grid {
			grid-template-columns: minmax(0, 1.2fr) repeat(2, minmax(0, 1fr));
			align-items: start;
		}

		.rich-text-editor__media-buttons {
			grid-template-columns: auto auto;
		}
	}
</style>
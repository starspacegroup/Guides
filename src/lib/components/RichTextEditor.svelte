<script context="module" lang="ts">
	let editorInstanceCount = 0;
</script>

<script lang="ts">
	import { onMount, tick } from 'svelte';

	import { enhanceCodeBlocks } from '$lib/utils/codeBlocks';
	import { getMarkdownHeadings, renderMarkdownToHtml } from '$lib/utils/markdown';
	import { editorHtmlToMarkdown } from '$lib/utils/richTextEditor';

	export let value = '';
	export let label = 'Rich text';
	export let placeholder = 'Start writing...';
	export let helpText = 'Supports headings, lists, tables, images, links, and fenced code blocks with languages.';
	export let uploadEndpoint = '/api/cms/uploads';
	export let showIntro = true;

	const DESKTOP_MEDIA_QUERY = '(min-width: 960px)';
	const IMAGE_URL_PATTERN = /^(https?:\/\/|data:image\/|\/|#|\.\.?\/)/i;

	type EditorTab = 'visual' | 'preview' | 'markdown';
	type MediaInsertMode = 'upload' | 'url';
	type MobilePanel = 'tools' | 'media' | null;
	type CodeLanguage = 'plaintext' | 'ts' | 'js' | 'python' | 'html' | 'css' | 'json' | 'sql' | 'bash';
	type CompatibleMediaQueryList = MediaQueryList & {
		addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
		removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
	};

	let activeTab: EditorTab = 'visual';
	let editorElement: HTMLDivElement | null = null;
	let languagePickerElement: HTMLSelectElement | null = null;
	let fileInputElement: HTMLInputElement | null = null;
	let codeLanguage: CodeLanguage = 'ts';
	let isDesktopLayout =
		typeof window !== 'undefined' && typeof window.matchMedia === 'function'
			? window.matchMedia(DESKTOP_MEDIA_QUERY).matches
			: false;
	let activeMobilePanel: MobilePanel = null;
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

	const codeLanguageOptions: { value: CodeLanguage; label: string }[] = [
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
	$: headingCount = documentOutline.length;
	$: showFormattingTools = isDesktopLayout || activeMobilePanel === 'tools';
	$: showMediaStudio = isDesktopLayout ? isMediaPanelOpen : activeMobilePanel === 'media';
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

	onMount(() => {
		syncEditorFromValue();

		if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
			return;
		}

		const desktopMedia = window.matchMedia(DESKTOP_MEDIA_QUERY) as CompatibleMediaQueryList;

		const syncResponsivePanels = (matches: boolean) => {
			isDesktopLayout = matches;
			if (matches) {
				activeMobilePanel = null;
			} else {
				activeMobilePanel = null;
				isMediaPanelOpen = false;
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

	$: if (activeTab === 'visual') {
		syncEditorFromValue();
	}

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
		mediaInsertMode = nextMode;
		mediaError = '';
		if (isDesktopLayout) {
			isMediaPanelOpen = true;
		} else {
			activeMobilePanel = 'media';
		}
		if (nextMode === 'url' && !imageUrl.trim()) {
			imageUrl = 'https://';
		}
	}

	function closeMediaPanel() {
		if (isDesktopLayout) {
			isMediaPanelOpen = false;
		} else if (activeMobilePanel === 'media') {
			activeMobilePanel = null;
		}
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

			let payload: { url?: string; message?: string } | null = null;
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
			openMediaPanel('upload');
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
		activeMobilePanel = activeMobilePanel === 'tools' ? null : 'tools';
		if (activeMobilePanel === 'tools') {
			isMediaPanelOpen = false;
		}
	}

	function toggleMediaPanel() {
		activeMobilePanel = activeMobilePanel === 'media' ? null : 'media';
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

	function getModeDescription(tab: EditorTab) {
		if (tab === 'visual') {
			return 'Write in the visual canvas first. Switch views only when you need to verify output or edit exact markdown.';
		}

		if (tab === 'preview') {
			return 'Check the rendered article without the editing chrome.';
		}

		return 'Edit the raw markdown directly when structure or fenced syntax needs precision.';
	}

	function getCountLabel(count: number, singular: string, plural: string): string {
		return `${count} ${count === 1 ? singular : plural}`;
	}
</script>

<div class="rich-text-editor" use:bindEditorKeydown>
	<div class="rich-text-editor__shell">
		{#if showIntro}
			<div class="rich-text-editor__intro">
				<div class="rich-text-editor__intro-copy">
					<span class="rich-text-editor__eyebrow">Body editor</span>
					<h3>{label}</h3>
					<p>{helpText}</p>
				</div>
				<div class="rich-text-editor__metrics" aria-label="Editor metrics">
					<span>{wordCount} words</span>
					<span>{characterCount} chars</span>
					<span>{readingTimeMinutes} min read</span>
				</div>
			</div>
		{/if}

		{#if !isDesktopLayout}
			<section class="rich-text-editor__mobile-rail" aria-label={`${label} editor controls`}>
				<div class="rich-text-editor__mobile-summary">
					<span class="rich-text-editor__mobile-kicker">Editor essentials</span>
					<div class="rich-text-editor__mobile-stats" aria-label="Editor mobile stats">
						<span>{getCountLabel(wordCount, 'word', 'words')}</span>
						<span>{getCountLabel(headingCount, 'heading', 'headings')}</span>
						<span>{getVisibleModeLabel(activeTab)}</span>
					</div>
				</div>
				<div class="rich-text-editor__mobile-actions">
					<button
						type="button"
						class="rich-text-editor__mobile-action"
						aria-controls={`${editorInstanceId}-tools`}
						aria-expanded={showFormattingTools}
						on:click={toggleToolsPanel}
					>
						{showFormattingTools ? 'Hide editor tools' : 'Show editor tools'}
					</button>
					<button
						type="button"
						class="rich-text-editor__mobile-action"
						aria-controls={`${editorInstanceId}-media`}
						aria-expanded={showMediaStudio}
						on:click={toggleMediaPanel}
					>
						{showMediaStudio ? 'Hide media tools' : 'Show media tools'}
					</button>
				</div>
			</section>
		{/if}

		<div class="rich-text-editor__workspace">
			<section class="rich-text-editor__canvas">
				<div class="rich-text-editor__mode-bar">
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
					<div class="rich-text-editor__mode-copy">
						<span class="rich-text-editor__mode-pill">{getVisibleModeLabel(activeTab)}</span>
						<p class="rich-text-editor__mode-description">{getModeDescription(activeTab)}</p>
					</div>
				</div>

				{#if isDesktopLayout || showFormattingTools || showMediaStudio}
					<div class="rich-text-editor__control-deck">
						{#if showFormattingTools}
							<section class="rich-text-editor__panel rich-text-editor__panel--toolbar">
								<div class="rich-text-editor__panel-header">
									<h4>Formatting</h4>
									<p>Keep the toolbar close to the text and let the canvas do the visual work.</p>
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
									<div class="rich-text-editor__group rich-text-editor__group--insert">
										<label class="rich-text-editor__field rich-text-editor__language-picker">
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
										<button type="button" class="rich-text-editor__panel-toggle" on:click={insertCodeBlock} aria-label="Code block">Code block</button>
										<button type="button" class="rich-text-editor__panel-toggle" on:click={() => openMediaPanel('upload')} aria-label="Insert image">Insert image</button>
										<button type="button" class="rich-text-editor__panel-toggle" on:click={insertTable} aria-label="Insert table">Insert table</button>
									</div>
								</div>
								<p class="rich-text-editor__shortcut-note">Shortcuts: Ctrl/Cmd+B for bold, Ctrl/Cmd+I for italic, Ctrl/Cmd+K for links.</p>
							</section>
						{/if}

						{#if showMediaStudio}
							<section class="rich-text-editor__panel rich-text-editor__media-studio" id={`${editorInstanceId}-media`} aria-label={`${label} media workflow`}>
								<div class="rich-text-editor__media-studio-header">
									<div>
										<h4>Image studio</h4>
										<p>Upload an image or point to a hosted URL without leaving the writing flow.</p>
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
											Use a hosted image URL when the asset already exists elsewhere.
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
					</div>
				{/if}

				{#if isVisualTab}
					<div class="rich-text-editor__editor-shell" class:is-drop-target={isDropTarget}>
						<div class="rich-text-editor__surface-frame">
							<div class="rich-text-editor__surface-header">
								<div class="rich-text-editor__surface-meta">Live article canvas</div>
								<p class="rich-text-editor__surface-note">Write directly into the article body. Images, tables, and code blocks stay available from the tools rail instead of competing with the canvas.</p>
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
				{:else if activeTab === 'preview'}
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
				{:else}
					<div class="rich-text-editor__surface-frame">
						<div class="rich-text-editor__surface-header">
							<div class="rich-text-editor__surface-meta">Markdown source</div>
							<p class="rich-text-editor__surface-note">Edit the raw source when structure or fenced syntax needs exact control.</p>
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
				{/if}
			</section>
		</div>
	</div>
</div>

<style>
	.rich-text-editor {
		display: grid;
		gap: var(--spacing-sm);
	}

	.rich-text-editor__shell {
		display: grid;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		background:
			radial-gradient(circle at top left, color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)) 0%, transparent 28%),
			linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 95%, var(--color-background)) 0%, var(--color-background) 100%);
		box-shadow: var(--shadow-md);
	}

	.rich-text-editor__intro,
	.rich-text-editor__mobile-rail,
	.rich-text-editor__mode-bar,
	.rich-text-editor__panel,
	.rich-text-editor__surface-frame {
		border: 1px solid color-mix(in srgb, var(--color-border) 86%, var(--color-background));
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-surface) 92%, var(--color-background));
	}

	.rich-text-editor__intro {
		display: grid;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
	}

	.rich-text-editor__intro-copy {
		display: grid;
		gap: var(--spacing-xs);
		max-width: 48rem;
	}

	.rich-text-editor__eyebrow,
	.rich-text-editor__mobile-kicker {
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-primary);
	}

	.rich-text-editor__intro-copy h3 {
		margin: 0;
		font-size: 1.5rem;
		line-height: 1.1;
	}

	.rich-text-editor__intro-copy p,
	.rich-text-editor__mode-description,
	.rich-text-editor__surface-note,
	.rich-text-editor__panel-header p,
	.rich-text-editor__media-status,
	.rich-text-editor__empty,
	.rich-text-editor__shortcut-note {
		margin: 0;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__metrics,
	.rich-text-editor__mobile-stats,
	.rich-text-editor__mobile-actions,
	.rich-text-editor__tabs,
	.rich-text-editor__group,
	.rich-text-editor__media-mode-switch,
	.rich-text-editor__media-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.rich-text-editor__metrics span,
	.rich-text-editor__mobile-stats span,
	.rich-text-editor__mode-pill,
	.rich-text-editor__surface-meta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.35rem 0.75rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 84%, var(--color-background));
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-background) 86%, var(--color-surface));
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.rich-text-editor__mobile-rail,
	.rich-text-editor__mode-bar,
	.rich-text-editor__control-deck,
	.rich-text-editor__media-actions,
	.rich-text-editor__media-studio-header,
	.rich-text-editor__panel-header,
	.rich-text-editor__mode-copy,
	.rich-text-editor__workspace,
	.rich-text-editor__field,
	.rich-text-editor__language-picker,
	.rich-text-editor__media-grid,
	.rich-text-editor__dropzone {
		display: grid;
		gap: var(--spacing-sm);
	}

	.rich-text-editor__mobile-rail,
	.rich-text-editor__mode-bar,
	.rich-text-editor__control-deck,
	.rich-text-editor__panel,
	.rich-text-editor__surface-header,
	.rich-text-editor__surface-stage {
		padding: var(--spacing-sm);
	}

	.rich-text-editor__canvas {
		min-width: 0;
	}

	.rich-text-editor__editor-shell.is-drop-target .rich-text-editor__surface-frame {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 28%, transparent);
	}

	.rich-text-editor__surface-frame {
		overflow: hidden;
	}

	.rich-text-editor__surface-header {
		display: grid;
		gap: var(--spacing-xs);
		border-bottom: 1px solid color-mix(in srgb, var(--color-border) 86%, var(--color-background));
	}

	.rich-text-editor__surface-stage {
		background: color-mix(in srgb, var(--color-background) 78%, var(--color-surface));
	}

	.rich-text-editor__surface-inner {
		max-width: 52rem;
		margin: 0 auto;
	}

	.rich-text-editor__surface,
	.rich-text-editor__preview,
	.rich-text-editor__source {
		width: 100%;
		min-height: clamp(24rem, 58vh, 42rem);
		padding: clamp(1rem, 2vw, 1.5rem);
		border: none;
		background: transparent;
		color: var(--color-text);
		font: inherit;
		line-height: 1.7;
	}

	.rich-text-editor__surface,
	.rich-text-editor__source {
		outline: none;
		resize: vertical;
	}

	.rich-text-editor__surface:empty::before {
		content: attr(data-placeholder);
		color: var(--color-text-secondary);
	}

	.rich-text-editor__toolbar {
		display: grid;
		gap: var(--spacing-xs);
	}

	.rich-text-editor__control-deck {
		margin-bottom: var(--spacing-sm);
	}

	.rich-text-editor__group--insert {
		align-items: end;
	}

	.rich-text-editor__group--insert .rich-text-editor__field {
		min-width: min(100%, 14rem);
		flex: 1 1 14rem;
	}

	.rich-text-editor__expand,
	.rich-text-editor__panel-toggle,
	.rich-text-editor__tab,
	.rich-text-editor__mobile-action,
	.rich-text-editor__toolbar button,
	.rich-text-editor__language-picker select,
	.rich-text-editor__dropzone,
	.rich-text-editor__field input {
		appearance: none;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		border-radius: var(--radius-md);
		padding: 0.7rem 0.9rem;
		font: inherit;
		transition:
			border-color var(--transition-fast),
			background-color var(--transition-fast),
			box-shadow var(--transition-fast);
	}

	.rich-text-editor__panel-toggle,
	.rich-text-editor__mobile-action,
	.rich-text-editor__toolbar button,
	.rich-text-editor__tab,
	.rich-text-editor__dropzone {
		cursor: pointer;
	}

	.rich-text-editor__tab.is-active,
	.rich-text-editor__toolbar button:hover,
	.rich-text-editor__panel-toggle:hover,
	.rich-text-editor__mobile-action:hover,
	.rich-text-editor__dropzone:hover {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
	}

	.rich-text-editor__expand:focus-visible,
	.rich-text-editor__panel-toggle:focus-visible,
	.rich-text-editor__tab:focus-visible,
	.rich-text-editor__mobile-action:focus-visible,
	.rich-text-editor__toolbar button:focus-visible,
	.rich-text-editor__language-picker select:focus-visible,
	.rich-text-editor__dropzone:focus-visible,
	.rich-text-editor__field input:focus-visible,
	.rich-text-editor__source:focus-visible,
	.rich-text-editor__surface:focus-visible {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 30%, transparent);
	}

	.rich-text-editor__expand {
		width: 100%;
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-background);
		font-weight: 700;
	}

	.rich-text-editor__expand:disabled {
		opacity: 0.7;
		cursor: progress;
	}

	.rich-text-editor__field span,
	.rich-text-editor__language-picker span {
		font-size: 0.8rem;
		font-weight: 600;
	}

	.rich-text-editor__dropzone {
		text-align: left;
	}

	.rich-text-editor__dropzone.is-drag-target {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
	}

	.rich-text-editor__dropzone-title {
		font-weight: 700;
	}

	.rich-text-editor__dropzone-copy,
	.rich-text-editor__media-error {
		color: var(--color-text-secondary);
	}

	.rich-text-editor__media-error {
		margin: 0;
		padding: 0.75rem 0.9rem;
		border-radius: var(--radius-md);
		border: 1px solid color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.rich-text-editor__shortcut-note {
		font-size: 0.8rem;
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
		.rich-text-editor__intro {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: start;
		}

		.rich-text-editor__control-deck {
			grid-template-columns: minmax(0, 1.25fr) minmax(18rem, 0.75fr);
			align-items: start;
		}

		.rich-text-editor__toolbar {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	@media (max-width: 959px) {
		.rich-text-editor__shell {
			padding: var(--spacing-sm);
		}

		.rich-text-editor__surface,
		.rich-text-editor__preview,
		.rich-text-editor__source {
			min-height: 20rem;
		}
	}
</style>

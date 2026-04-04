function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

const LANGUAGE_LABELS: Record<string, string> = {
	plaintext: 'Code',
	ts: 'TypeScript',
	tsx: 'TSX',
	js: 'JavaScript',
	jsx: 'JSX',
	python: 'Python',
	html: 'HTML',
	svelte: 'Svelte',
	css: 'CSS',
	json: 'JSON',
	sql: 'SQL',
	bash: 'Bash',
	sh: 'Shell'
};

const LANGUAGE_KEYWORDS: Record<string, string[]> = {
	ts: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'type', 'interface', 'import', 'from', 'export', 'async', 'await', 'new', 'extends'],
	tsx: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'type', 'interface', 'import', 'from', 'export', 'async', 'await', 'new', 'extends'],
	js: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'import', 'from', 'export', 'async', 'await', 'new'],
	jsx: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'import', 'from', 'export', 'async', 'await', 'new'],
	python: ['def', 'return', 'if', 'else', 'elif', 'class', 'import', 'from', 'for', 'while', 'try', 'except', 'with', 'as'],
	css: ['display', 'position', 'background', 'color', 'border', 'padding', 'margin', 'grid', 'flex'],
	sql: ['select', 'from', 'where', 'insert', 'into', 'update', 'set', 'delete', 'join', 'order', 'group', 'by'],
	bash: ['if', 'then', 'else', 'fi', 'for', 'do', 'done', 'case', 'esac', 'function'],
	sh: ['if', 'then', 'else', 'fi', 'for', 'do', 'done', 'case', 'esac', 'function'],
	json: [],
	html: [],
	svelte: ['const', 'let', 'function', 'if', 'else', 'import', 'from', 'export']
};

function normalizeLanguage(language?: string | null): string {
	return language?.trim().toLowerCase() ?? '';
}

function getLanguageLabel(language?: string | null): string {
	const key = normalizeLanguage(language);
	return LANGUAGE_LABELS[key] ?? (key ? key.toUpperCase() : 'Code');
}

function getKeywordPattern(language: string): RegExp | null {
	const keywords = LANGUAGE_KEYWORDS[language] ?? [];
	if (keywords.length === 0) {
		return null;
	}

	return new RegExp(`\\b(?:${keywords.join('|')})\\b`, language === 'sql' ? 'gi' : 'g');
}

function highlightMarkup(code: string): string {
	return code.replace(
		/(&lt;\/?)([A-Za-z][\w:-]*)([\s\S]*?)(\/?&gt;)/g,
		(_, open, tagName, attributes, close) => {
			const highlightedAttributes = attributes.replace(
				/([A-Za-z_:][-A-Za-z0-9_:.]*)(=)(&quot;[\s\S]*?&quot;|&#39;[\s\S]*?&#39;|\{[^}]+\})?/g,
				(attributeMatch, name, equals, value) => {
					const highlightedValue = value
						? `<span class="token string">${value}</span>`
						: '';
					return `<span class="token attr-name">${name}</span>${equals}${highlightedValue}`;
				}
			);

			return `<span class="token punctuation">${open}</span><span class="token tag">${tagName}</span>${highlightedAttributes}<span class="token punctuation">${close}</span>`;
		}
	);
}

export function highlightCodeToHtml(code: string, language?: string | null): string {
	const normalizedLanguage = normalizeLanguage(language);
	const placeholderSegments: string[] = [];
	const stash = (segment: string): string => {
		const token = `@@CODETOKEN${placeholderSegments.length}@@`;
		placeholderSegments.push(segment);
		return token;
	};
	const restore = (value: string): string =>
		placeholderSegments.reduce(
			(output, segment, index) => output.replaceAll(`@@CODETOKEN${index}@@`, segment),
			value
		);

	let html = escapeHtml(code);

	if (normalizedLanguage === 'html' || normalizedLanguage === 'svelte') {
		html = highlightMarkup(html);
	}

	html = html.replace(/(&quot;[\s\S]*?&quot;|&#39;[\s\S]*?&#39;|`(?:\\.|[^`])*?`)/g, (match) =>
		stash(`<span class="token string">${match}</span>`)
	);

	if (normalizedLanguage === 'ts' || normalizedLanguage === 'tsx' || normalizedLanguage === 'js' || normalizedLanguage === 'jsx' || normalizedLanguage === 'css' || normalizedLanguage === 'svelte') {
		html = html.replace(/(\/\*[\s\S]*?\*\/|\/\/[^\n]*)/g, (match) =>
			stash(`<span class="token comment">${match}</span>`)
		);
	}

	if (normalizedLanguage === 'python' || normalizedLanguage === 'bash' || normalizedLanguage === 'sh') {
		html = html.replace(/(^|\s)(#[^\n]*)/gm, (_, prefix, comment) =>
			`${prefix}${stash(`<span class="token comment">${comment}</span>`)}`
		);
	}

	if (normalizedLanguage === 'sql') {
		html = html.replace(/(--[^\n]*)/g, (match) => stash(`<span class="token comment">${match}</span>`));
	}

	const keywordPattern = getKeywordPattern(normalizedLanguage);
	if (keywordPattern) {
		html = html.replace(keywordPattern, (match) => stash(`<span class="token keyword">${match}</span>`));
	}

	html = html.replace(/\b(?:true|false|null|undefined)\b/g, (match) =>
		stash(`<span class="token boolean">${match}</span>`)
	);

	html = html.replace(/\b\d+(?:\.\d+)?\b/g, (match) =>
		stash(`<span class="token number">${match}</span>`)
	);

	return restore(html);
}

function getCodeLanguage(pre: HTMLElement, code: HTMLElement): string {
	const fromData = pre.dataset.language;
	if (fromData) {
		return fromData;
	}

	const languageClass = Array.from(code.classList).find((className) => className.startsWith('language-'));
	return languageClass ? languageClass.replace('language-', '') : 'plaintext';
}

export function decorateCodeBlocks(root: ParentNode): void {
	const codeNodes = Array.from(root.querySelectorAll('pre code'));

	for (const codeNode of codeNodes) {
		const codeElement = codeNode as HTMLElement;
		const pre = codeElement.parentElement;
		if (!pre || pre.closest('.cms-code-block')) {
			continue;
		}

		const language = getCodeLanguage(pre as HTMLElement, codeElement);
		const languageLabel = getLanguageLabel(language);
		const rawCode = codeElement.textContent ?? '';

		codeElement.dataset.rawCode = rawCode;
		codeElement.innerHTML = highlightCodeToHtml(rawCode, language);

		const wrapper = document.createElement('div');
		wrapper.className = 'cms-code-block';
		wrapper.dataset.language = languageLabel;

		const toolbar = document.createElement('div');
		toolbar.className = 'cms-code-block-toolbar';

		const label = document.createElement('span');
		label.className = 'cms-code-block-language';
		label.textContent = languageLabel;

		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'cms-code-block-copy';
		button.dataset.copyCode = 'true';
		button.dataset.defaultLabel = 'Copy';
		button.setAttribute('aria-label', `Copy ${languageLabel} code`);
		button.textContent = 'Copy';

		toolbar.append(label, button);
		pre.replaceWith(wrapper);
		wrapper.append(toolbar, pre);
	}
}

const resetTimers = new WeakMap<HTMLButtonElement, number>();

async function writeTextToClipboard(value: string): Promise<void> {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(value);
		return;
	}

	const textArea = document.createElement('textarea');
	textArea.value = value;
	textArea.setAttribute('readonly', 'true');
	textArea.style.position = 'fixed';
	textArea.style.opacity = '0';
	document.body.append(textArea);
	textArea.select();
	document.execCommand('copy');
	textArea.remove();
}

function setButtonState(button: HTMLButtonElement, label: string, state: string): void {
	const existingTimer = resetTimers.get(button);
	if (existingTimer) {
		window.clearTimeout(existingTimer);
	}

	button.textContent = label;
	button.dataset.copyState = state;

	const timer = window.setTimeout(() => {
		button.textContent = button.dataset.defaultLabel || 'Copy';
		button.dataset.copyState = 'idle';
		resetTimers.delete(button);
	}, 1800);

	resetTimers.set(button, timer);
}

export function attachCodeBlockCopy(root: HTMLElement): () => void {
	const handleClick = async (event: Event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		const button = target.closest('[data-copy-code]');
		if (!(button instanceof HTMLButtonElement) || !root.contains(button)) {
			return;
		}

		const codeElement = button.closest('.cms-code-block')?.querySelector('pre code');
		const rawCode = codeElement instanceof HTMLElement ? codeElement.dataset.rawCode || codeElement.textContent || '' : '';
		if (!rawCode) {
			return;
		}

		try {
			await writeTextToClipboard(rawCode);
			setButtonState(button, 'Copied', 'copied');
		} catch {
			setButtonState(button, 'Retry', 'error');
		}
	};

	root.addEventListener('click', handleClick);

	return () => {
		root.removeEventListener('click', handleClick);
	};
}

export function enhanceCodeBlocks(node: HTMLElement): { update: () => void; destroy: () => void; } {
	decorateCodeBlocks(node);
	const cleanup = attachCodeBlockCopy(node);

	return {
		update() {
			decorateCodeBlocks(node);
		},
		destroy() {
			cleanup();
		}
	};
}
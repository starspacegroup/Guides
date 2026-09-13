import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	attachCodeBlockCopy,
	decorateCodeBlocks,
	enhanceCodeBlocks,
	highlightCodeToHtml
} from '$lib/utils/codeBlocks';
import { renderMarkdownToHtml, getMarkdownHeadings } from '$lib/utils/markdown';
import { editorHtmlToMarkdown } from '$lib/utils/richTextEditor';
import { enhanceRainbowTitle, rainbowTitleRegion } from '$lib/utils/rainbow-title';
import { sanitizeCmsUrl } from '$lib/cms/sanitize';

afterEach(() => {
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('code block edge behavior', () => {
	it.each([
		['html', '<a href="/">x</a>', 'token tag'],
		['svelte', '<Button disabled={true}>x</Button>', 'token attr-name'],
		['python', 'def run():\n  # comment\n  return 2', 'token comment'],
		['bash', 'if true; then # comment\nfi', 'token keyword'],
		['sql', 'SELECT 1 -- comment', 'token comment'],
		['json', '{"ready": true, "count": 2}', 'token number'],
		['unknown', '<>&"\'', '&lt;&gt;&amp;&quot;&#<span class="token number">39</span>;']
	])('highlights %s source safely', (language, source, expected) => {
		expect(highlightCodeToHtml(source, language)).toContain(expected);
	});

	it('uses language classes and ignores already decorated or detached code', () => {
		const root = document.createElement('div');
		root.innerHTML =
			'<pre><code class="language-python">return true</code></pre><div class="cms-code-block"><pre><code>x</code></pre></div>';
		decorateCodeBlocks(root);
		expect(root.querySelector('.cms-code-block')?.getAttribute('data-language')).toBe('Python');
		expect(root.querySelectorAll('.cms-code-block')).toHaveLength(2);
		const detached = document.createElement('code');
		const custom = { querySelectorAll: () => [detached] } as unknown as ParentNode;
		decorateCodeBlocks(custom);
	});

	it('copies raw code and resets button state', async () => {
		vi.useFakeTimers();
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
		const root = document.createElement('div');
		root.innerHTML = '<pre><code>copy me</code></pre>';
		decorateCodeBlocks(root);
		const cleanup = attachCodeBlockCopy(root);
		const button = root.querySelector('button')!;
		button.click();
		await vi.runAllTimersAsync();
		expect(writeText).toHaveBeenCalledWith('copy me');
		expect(button.textContent).toBe('Copy');
		cleanup();
		vi.useRealTimers();
	});

	it('shows retry when clipboard writes fail and ignores irrelevant clicks', async () => {
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
			configurable: true
		});
		const root = document.createElement('div');
		root.innerHTML =
			'<button>other</button><div class="cms-code-block"><button data-copy-code data-default-label="Copy"></button><pre><code data-raw-code="x">x</code></pre></div>';
		const cleanup = attachCodeBlockCopy(root);
		root.querySelector('button')!.click();
		const copy = root.querySelector('[data-copy-code]') as HTMLButtonElement;
		copy.click();
		await vi.waitFor(() => expect(copy.dataset.copyState).toBe('error'));
		cleanup();
	});

	it('uses the legacy clipboard fallback and handles repeated copy state changes', async () => {
		Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
		Object.defineProperty(document, 'execCommand', {
			value: vi.fn().mockReturnValue(true),
			writable: true,
			configurable: true
		});
		vi.useFakeTimers();
		const root = document.createElement('div');
		root.innerHTML =
			'<div class="cms-code-block"><button data-copy-code></button><pre><code data-raw-code="fallback">fallback</code></pre></div>';
		const cleanup = attachCodeBlockCopy(root);
		const button = root.querySelector('button')!;
		button.click();
		await Promise.resolve();
		button.click();
		await vi.runAllTimersAsync();
		expect(document.execCommand).toHaveBeenCalledWith('copy');
		cleanup();
		vi.useRealTimers();
	});

	it('ignores non-element, detached, and empty copy targets', () => {
		const root = document.createElement('div');
		root.innerHTML =
			'<button data-copy-code></button><div class="cms-code-block"><button data-copy-code></button><pre><code></code></pre></div>';
		const cleanup = attachCodeBlockCopy(root);
		root.dispatchEvent(new Event('click'));
		root.querySelectorAll('button').forEach((button) => button.click());
		cleanup();
	});

	it('normalizes absent and custom language labels and valueless markup attributes', () => {
		expect(highlightCodeToHtml('plain', undefined)).toBe('plain');
		expect(highlightCodeToHtml('<input disabled=>', 'html')).toContain('attr-name');
		const root = document.createElement('div');
		root.innerHTML =
			'<pre><code>plain</code></pre><pre data-language="custom"><code>x</code></pre>';
		decorateCodeBlocks(root);
		expect(
			Array.from(root.querySelectorAll('.cms-code-block-language'), (node) => node.textContent)
		).toEqual(['Code', 'CUSTOM']);
	});

	it('updates and destroys the combined enhancement', () => {
		const root = document.createElement('div');
		root.innerHTML = '<pre><code>x</code></pre><table><tr><td>x</td></tr></table>';
		const action = enhanceCodeBlocks(root);
		action.update();
		action.destroy();
	});
});

describe('Markdown and editor edge behavior', () => {
	it('renders every block form and handles unterminated fences', () => {
		const html = renderMarkdownToHtml(
			'---\n\n1. one\n2. two\n\n> quote\n> next\n\n```\n<unsafe>\n\nparagraph\ncontinued'
		);
		expect(html).toContain('<hr>');
		expect(html).toContain('<ol>');
		expect(html).toContain('<blockquote>');
		expect(html).toContain('&lt;unsafe&gt;');
	});

	it('handles empty, duplicate, formatted, and punctuation headings', () => {
		expect(renderMarkdownToHtml(null)).toBe('');
		expect(getMarkdownHeadings('')).toEqual([]);
		const headings = getMarkdownHeadings('# **A** `B` [C](/c) ![D](/d)\n# !!!');
		expect(headings[0].id).toBe('a-b-c-d');
		expect(headings[1].id).toBe('section');
	});

	it('renders titled and untitled images and rejects unsafe sources', () => {
		const html = renderMarkdownToHtml(
			'![alt](mailto:x)\n\nText ![safe](https://example.com/a.png) and ![bad](data:x)'
		);
		expect(html).toContain('https://example.com/a.png');
		expect(html).toContain('![bad](data:x)');
	});

	it('serializes rich editor block and inline variants', () => {
		const markdown = editorHtmlToMarkdown(`
			<h2>Heading <strong>bold</strong></h2>
			<p><em>italic</em> <code>a\`b</code> <a href="/guide">link</a><br>next</p>
			<blockquote><p>quoted</p></blockquote><hr>
			<ul><li>one<ol><li>nested</li></ol></li></ul>
			<pre data-language="ts"><code>const x = 1;\n</code></pre>
			<figure><img src="/image.png" alt="Alt"><figcaption>Caption</figcaption></figure>
			<table><tr><th>A|B</th></tr><tr><td>C</td></tr></table>
		`);
		expect(markdown).toContain('## Heading **bold**');
		expect(markdown).toContain('> quoted');
		expect(markdown).toContain('```ts');
		expect(markdown).toContain('![Alt](/image.png "Caption")');
		expect(markdown).toContain('| A\\|B |');
	});

	it('handles empty and malformed editor elements', () => {
		expect(editorHtmlToMarkdown(' ')).toBe('');
		expect(
			editorHtmlToMarkdown(
				'<h1></h1><pre></pre><pre><code data-language="js">x</code></pre><pre><code class="plain">y</code></pre><table></table><figure><span>x</span></figure><figure><img></figure><img><br><!-- comment --><div><p>nested</p></div>'
			)
		).toContain('x');
	});

	it('serializes empty inline styles and links without destinations', () => {
		const markdown = editorHtmlToMarkdown(
			'<p><strong></strong><b>b</b><em></em><i>i</i><code></code><a>label</a><a href="/empty"></a><img><img src="/x"><img src="/y" alt="Y" title="Title"><span>plain</span></p>'
		);
		expect(markdown).toContain('**b**');
		expect(markdown).toContain('*i*');
		expect(markdown).toContain('label');
		expect(markdown).toContain('![Y](/y "Title")');
	});

	it('serializes mixed list children and multiline quotes', () => {
		const markdown = editorHtmlToMarkdown(
			'<ul><span>ignored</span><li>text<span>x</span><ol><li>nested</li></ol><ul><li>nested two</li></ul></li></ul><blockquote><p>one<br>two</p></blockquote><blockquote></blockquote><figure><img src="/z"></figure><p>text<!-- inline comment --></p>'
		);
		expect(markdown).toContain('nested');
		expect(markdown).toContain('> one');
		expect(markdown).toContain('![](/z)');
	});

	it('uses its server-safe plain-text fallback', () => {
		const original = globalThis.document;
		vi.stubGlobal('document', undefined);
		expect(editorHtmlToMarkdown('<p>Hello&nbsp; world</p>')).toBe('Hello&nbsp; world');
		vi.stubGlobal('document', original);
	});
});

describe('rainbow title edge behavior', () => {
	it('ignores ineligible and already enhanced nodes', () => {
		for (const html of [
			'<h1></h1>',
			'<h1><span>x</span></h1>',
			'<h1 data-rainbow-title-enhanced="true">x</h1>'
		]) {
			const host = document.createElement('div');
			host.innerHTML = html;
			enhanceRainbowTitle(host.firstElementChild as HTMLElement)();
		}
	});

	it('supports keyboard selection, clearing, and attribute restoration', () => {
		const title = document.createElement('h1');
		title.dataset.rainbowTitle = 'true';
		title.setAttribute('aria-label', 'Original');
		title.setAttribute('tabindex', '2');
		title.textContent = 'Select me';
		document.body.append(title);
		const cleanup = enhanceRainbowTitle(title);
		title.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		expect(title.classList.contains('rainbow-title--selected')).toBe(true);
		title.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		cleanup();
		expect(title.getAttribute('aria-label')).toBe('Original');
		expect(title.getAttribute('tabindex')).toBe('2');
	});

	it('ignores off-character pointer activity and supports reverse dragging', () => {
		const title = document.createElement('h1');
		title.dataset.rainbowTitle = 'true';
		title.textContent = 'Drag';
		document.body.append(title);
		const cleanup = enhanceRainbowTitle(title);
		const chars = title.querySelectorAll<HTMLElement>('.rainbow-title__char');
		title.dispatchEvent(new MouseEvent('mousedown', { button: 1, bubbles: true }));
		title.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
		chars[3].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
		chars[3].dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
		chars[0].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
		expect(chars[0].classList.contains('is-selected')).toBe(true);
		cleanup();
	});

	it('reconciles changed and removed titles in a region', async () => {
		const host = document.createElement('main');
		host.innerHTML = '<h1 data-rainbow-title="true">Old title</h1>';
		document.body.append(host);
		const action = rainbowTitleRegion(host);
		host.querySelector('h1')!.remove();
		await Promise.resolve();
		action.destroy();
	});

	it('supports the grapheme fallback and a title used as the region root', () => {
		const segmenter = Intl.Segmenter;
		delete (Intl as any).Segmenter;
		try {
			const title = document.createElement('h1');
			title.dataset.rainbowTitle = 'true';
			title.textContent = 'Root';
			document.body.append(title);
			const action = rainbowTitleRegion(title);
			expect(title.querySelectorAll('.rainbow-title__char')).toHaveLength(4);
			action.destroy();
		} finally {
			Object.defineProperty(Intl, 'Segmenter', { value: segmenter, configurable: true });
		}
	});

	it('rebuilds a managed title when its source marker changes', async () => {
		const host = document.createElement('main');
		host.innerHTML = '<h1 data-rainbow-title="true">Current</h1>';
		document.body.append(host);
		const action = rainbowTitleRegion(host);
		const title = host.querySelector('h1')!;
		title.dataset.rainbowTitleSource = 'Stale';
		host.append(document.createTextNode('trigger'));
		await Promise.resolve();
		expect(title.dataset.rainbowTitleSource).toBe('Current');
		action.destroy();
	});
});

describe('CMS URL sanitization edges', () => {
	it.each([
		['jav&#x61;script&colon;alert(1)', false, null],
		[' mailto:test@example.com ', false, 'mailto:test@example.com'],
		['mailto:test@example.com', true, null],
		['tel:123', false, 'tel:123'],
		['#section', false, '#section'],
		['../guide', false, '../guide'],
		['', false, null]
	])('sanitizes %s', (value, image, expected) => {
		expect(sanitizeCmsUrl(value, image)).toBe(expected);
	});
});

import { describe, expect, it } from 'vitest';

import { decorateCodeBlocks, highlightCodeToHtml, wrapTablesForScroll } from './codeBlocks';

describe('code block enhancements', () => {
	it('highlights TypeScript keywords, strings, and booleans', () => {
		const html = highlightCodeToHtml(
			'const enabled = true;\nconst label = "Switch to dark mode";',
			'ts'
		);

		expect(html).toContain('<span class="token keyword">const</span> enabled = <span class="token boolean">true</span>;');
		expect(html).toContain('<span class="token string">&quot;Switch to dark mode&quot;</span>');
	});

	it('wraps rendered preformatted blocks with a language label and copy button', () => {
		const root = document.createElement('div');
		root.innerHTML = '<pre data-language="ts"><code class="language-ts">const valid = true;</code></pre>';

		decorateCodeBlocks(root);

		const wrapper = root.querySelector('.cms-code-block');
		expect(wrapper).toBeTruthy();
		expect(wrapper?.getAttribute('data-language')).toBe('TypeScript');
		expect(root.querySelector('.cms-code-block-language')?.textContent).toBe('TypeScript');
		expect(root.querySelector('.cms-code-block-copy')?.getAttribute('aria-label')).toBe('Copy TypeScript code');
		expect(root.querySelector('pre code')?.innerHTML).toContain('<span class="token keyword">const</span> valid = <span class="token boolean">true</span>;');
	});

	it('wraps bare tables in a .cms-table-scroll div for mobile horizontal scroll', () => {
		const root = document.createElement('div');
		root.innerHTML = '<table><tr><td>Cell</td></tr></table>';

		wrapTablesForScroll(root);

		const wrapper = root.querySelector('.cms-table-scroll');
		expect(wrapper).toBeTruthy();
		expect(wrapper?.querySelector('table')).toBeTruthy();
	});

	it('does not double-wrap tables already inside a .cms-table-scroll', () => {
		const root = document.createElement('div');
		root.innerHTML = '<div class="cms-table-scroll"><table><tr><td>Cell</td></tr></table></div>';

		wrapTablesForScroll(root);

		// Should still be exactly one wrapper
		expect(root.querySelectorAll('.cms-table-scroll').length).toBe(1);
	});
});

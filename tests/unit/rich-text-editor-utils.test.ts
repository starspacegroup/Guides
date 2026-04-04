import { describe, expect, it } from 'vitest';

import { editorHtmlToMarkdown } from '../../src/lib/utils/richTextEditor';

describe('editorHtmlToMarkdown', () => {
  it('converts common rich text blocks to markdown', () => {
    const markdown = editorHtmlToMarkdown(`
			<h2>Guide Title</h2>
			<p><strong>Bold</strong> text with <em>emphasis</em> and <a href="https://example.com">link</a>.</p>
			<figure><img src="https://example.com/diagram.png" alt="Diagram" title="System diagram"></figure>
			<table>
				<thead><tr><th>Feature</th><th>Status</th></tr></thead>
				<tbody><tr><td>Images</td><td>Ready</td></tr></tbody>
			</table>
			<blockquote><p>Quoted advice</p></blockquote>
			<ul><li>First item</li><li>Second item</li></ul>
			<pre data-language="ts"><code class="language-ts">const valid = true;</code></pre>
		`);

    expect(markdown).toContain('## Guide Title');
    expect(markdown).toContain('**Bold** text with *emphasis* and [link](https://example.com).');
    expect(markdown).toContain('![Diagram](https://example.com/diagram.png "System diagram")');
    expect(markdown).toContain('| Feature | Status |');
    expect(markdown).toContain('| Images | Ready |');
    expect(markdown).toContain('> Quoted advice');
    expect(markdown).toContain('- First item');
    expect(markdown).toContain('```ts\nconst valid = true;\n```');
  });

  it('drops empty placeholder paragraphs when converting editor html', () => {
    const markdown = editorHtmlToMarkdown('<p><br></p><p>Real content</p><p></p>');

    expect(markdown).toBe('Real content');
  });
});
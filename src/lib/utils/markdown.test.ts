import { describe, expect, it } from 'vitest';
import { renderMarkdownToHtml } from './markdown';

describe('renderMarkdownToHtml', () => {
  it('renders headings, paragraphs, emphasis, and lists', () => {
    const html = renderMarkdownToHtml(`# Rule

Validation errors shown too early interrupt the user.

- Show field-level errors after blur
- Show all errors on submit

Use **clear** copy and _helpful_ guidance.`);

    expect(html).toContain('<h1>Rule</h1>');
    expect(html).toContain('<p>Validation errors shown too early interrupt the user.</p>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Show field-level errors after blur</li>');
    expect(html).toContain('<strong>clear</strong>');
    expect(html).toContain('<em>helpful</em>');
  });

  it('renders fenced code blocks and inline code safely', () => {
    const html = renderMarkdownToHtml('Use `aria-describedby`.\n\n```ts\nconst valid = true;\n```');

    expect(html).toContain('<p>Use <code>aria-describedby</code>.</p>');
    expect(html).toContain('<pre><code>const valid = true;</code></pre>');
  });

  it('escapes raw html while keeping markdown links safe', () => {
    const html = renderMarkdownToHtml(
      '<script>alert(1)</script> [Open guide](/ui-patterns) [Bad](javascript:alert(1))'
    );

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('<a href="/ui-patterns">Open guide</a>');
    expect(html).toContain('[Bad](javascript:alert(1))');
    expect(html).not.toContain('javascript:alert(1)"');
  });
});
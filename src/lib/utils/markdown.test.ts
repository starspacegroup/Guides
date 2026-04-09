import { describe, expect, it } from 'vitest';
import { getMarkdownHeadings, renderMarkdownToHtml } from './markdown';

describe('renderMarkdownToHtml', () => {
  it('renders headings, paragraphs, emphasis, and lists', () => {
    const html = renderMarkdownToHtml(`# Rule

Validation errors shown too early interrupt the user.

- Show field-level errors after blur
- Show all errors on submit

Use **clear** copy and _helpful_ guidance.`);

    expect(html).toContain('<h1 id="rule">Rule</h1>');
    expect(html).toContain('<p>Validation errors shown too early interrupt the user.</p>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Show field-level errors after blur</li>');
    expect(html).toContain('<strong>clear</strong>');
    expect(html).toContain('<em>helpful</em>');
  });

  it('adds stable anchor ids to headings and exposes matching toc data', () => {
    const markdown = `# Rule

## Why this matters

### Keyboard support

## Why this matters`;
    const html = renderMarkdownToHtml(markdown);
    const headings = getMarkdownHeadings(markdown);

    expect(html).toContain('<h2 id="why-this-matters">Why this matters</h2>');
    expect(html).toContain('<h3 id="keyboard-support">Keyboard support</h3>');
    expect(html).toContain('<h2 id="why-this-matters-2">Why this matters</h2>');
    expect(headings).toEqual([
      { level: 1, text: 'Rule', id: 'rule' },
      { level: 2, text: 'Why this matters', id: 'why-this-matters' },
      { level: 3, text: 'Keyboard support', id: 'keyboard-support' },
      { level: 2, text: 'Why this matters', id: 'why-this-matters-2' }
    ]);
  });

  it('renders fenced code blocks and inline code safely', () => {
    const html = renderMarkdownToHtml('Use `aria-describedby`.\n\n```ts\nconst valid = true;\n```');

    expect(html).toContain('<p>Use <code>aria-describedby</code>.</p>');
    expect(html).toContain('<pre data-language="ts"><code class="language-ts">const valid = true;</code></pre>');
  });

  it('renders markdown images and tables', () => {
    const html = renderMarkdownToHtml(
      '![Diagram](https://example.com/diagram.png "System diagram")\n\n| Feature | Status |\n| --- | --- |\n| Images | Ready |\n| Tables | Ready |'
    );

    expect(html).toContain(
      '<figure><img src="https://example.com/diagram.png" alt="Diagram" title="System diagram"><figcaption>System diagram</figcaption></figure>'
    );
    expect(html).toContain('<table>');
    expect(html).toContain('<th>Feature</th>');
    expect(html).toContain('<td>Tables</td>');
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

  it('does not treat intraword underscores as emphasis', () => {
    const markdown = `# Telemetry

- theme_toggle_clicked
- theme_changed
- theme_preference_source`;

    const html = renderMarkdownToHtml(markdown);
    const headings = getMarkdownHeadings(markdown);

    expect(html).toContain('<li>theme_toggle_clicked</li>');
    expect(html).toContain('<li>theme_changed</li>');
    expect(html).toContain('<li>theme_preference_source</li>');
    expect(html).not.toContain('<em>toggle</em>');
    expect(html).not.toContain('<em>preference</em>');
    expect(headings).toEqual([{ level: 1, text: 'Telemetry', id: 'telemetry' }]);
  });
});
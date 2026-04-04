import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Content item page styles', () => {
  it('uses wider desktop content surfaces and richer prose spacing', () => {
    const source = readFileSync(
      'c:/Users/monag/_Projects/starspace/Guides/src/routes/[contentType]/[slug]/+page.svelte',
      'utf8'
    );

    expect(source).toContain('max-width: 82ch;');
    expect(source).toContain('width: min(100%, 82rem);');
    expect(source).toContain('.cms-article-sidebar');
    expect(source).toContain('.cms-article-toc');
    expect(source).toContain('.cms-content :global(> :first-child)');
    expect(source).toContain('.cms-content :global(table)');
    expect(source).toContain('.cms-content :global(hr)');
    expect(source).toContain('max-width: 1560px;');
  });
});
import { describe, expect, it } from 'vitest';
import source from '../../src/routes/[contentType]/[slug]/+page.svelte?raw';

describe('Content item page styles', () => {
  it('uses wider desktop content surfaces and richer prose spacing', () => {
    expect(source).toContain('max-width: 82ch;');
    expect(source).toContain('width: min(100%, 82rem);');
    expect(source).toContain('.cms-article-sidebar');
    expect(source).toContain('.cms-article-toc');
    expect(source).toContain('.cms-content :global(> :first-child)');
    expect(source).toContain('.cms-content :global(table)');
    expect(source).toContain('.cms-content :global(hr)');
    expect(source).toContain('.cms-content :global(.cms-code-block)');
    expect(source).toContain('.cms-content :global(.cms-code-block-copy)');
    expect(source).toContain('.cms-content :global(.token.keyword)');
    expect(source).toContain('max-width: 1560px;');
  });
});
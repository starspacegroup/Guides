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

  it('is mobile-first and prevents horizontal overflow', () => {
    // Page container is contained
    expect(source).toContain('overflow-x: hidden');
    // Grid children have min-width: 0 so code/tables cannot expand grid tracks
    expect(source).toContain('min-width: 0');
    // Code block pre has explicit overflow-x: auto so it scrolls instead of clipping
    expect(source).toContain('.cms-content :global(.cms-code-block pre)');
    expect(source).toMatch(/\.cms-content :global\(\.cms-code-block pre\)[^}]*overflow-x: auto/s);
    // Table scroll wrapper class is styled so tables scroll on mobile
    expect(source).toContain('.cms-content :global(.cms-table-scroll)');
  });
});

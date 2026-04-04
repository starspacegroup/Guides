import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Content type list page responsiveness', () => {
  it('uses a four-column blog grid on large desktop screens', () => {
    const source = readFileSync(
      'c:/Users/monag/_Projects/starspace/Guides/src/routes/[contentType]/+page.svelte',
      'utf8'
    );

    expect(source).toContain('max-width: 1720px;');
    expect(source).toContain('@media (min-width: 1400px)');
    expect(source).toContain('grid-template-columns: repeat(4, 1fr);');
  });
});
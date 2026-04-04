import { describe, expect, it } from 'vitest';
import source from '../../src/routes/[contentType]/+page.svelte?raw';

describe('Content type list page responsiveness', () => {
  it('uses a four-column blog grid on large desktop screens', () => {
    expect(source).toContain('max-width: 1720px;');
    expect(source).toContain('@media (min-width: 1400px)');
    expect(source).toContain('grid-template-columns: repeat(4, 1fr);');
  });
});
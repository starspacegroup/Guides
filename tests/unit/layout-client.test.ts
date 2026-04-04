import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyDocumentTheme,
  canUseDocument,
  markAppHydrated,
  shouldToggleCommandPaletteShortcut
} from '../../src/lib/utils/layout-client';

describe('Root layout client behavior', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-app-hydrated');
    document.documentElement.removeAttribute('data-theme');
  });

  it('marks the app as hydrated and applies the active theme to the document', () => {
    markAppHydrated();
    applyDocumentTheme('light');

    expect(canUseDocument()).toBe(true);
    expect(document.documentElement.getAttribute('data-app-hydrated')).toBe('true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    applyDocumentTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('recognizes the command palette keyboard shortcuts', () => {
    expect(
      shouldToggleCommandPaletteShortcut({
        key: 'k',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false
      })
    ).toBe(true);

    expect(
      shouldToggleCommandPaletteShortcut({
        key: 'P',
        ctrlKey: true,
        metaKey: false,
        shiftKey: true
      })
    ).toBe(true);
  });

  it('ignores unrelated keyboard shortcuts', () => {
    expect(
      shouldToggleCommandPaletteShortcut({
        key: 'p',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false
      })
    ).toBe(false);

    expect(
      shouldToggleCommandPaletteShortcut({
        key: 'k',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false
      })
    ).toBe(false);
  });
});
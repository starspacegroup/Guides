import TableSortingPaginationDemo from '$lib/components/article-demos/TableSortingPaginationDemo.svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

describe('TableSortingPaginationDemo', () => {
  it('reflects the active page in the URL and resets pagination when the sort key changes', async () => {
    const originalReplaceState = window.history.replaceState;
    const replaceStateMock = vi.fn();
    const replaceStateSpy =
      typeof originalReplaceState === 'function'
        ? vi.spyOn(window.history, 'replaceState')
        : replaceStateMock;

    if (typeof originalReplaceState !== 'function') {
      Object.defineProperty(window.history, 'replaceState', {
        configurable: true,
        value: replaceStateMock
      });
    }

    try {
      render(TableSortingPaginationDemo);

      await fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      expect(screen.getByRole('button', { name: 'Prev' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
      expect(String(replaceStateSpy.mock.lastCall?.[2])).toContain('page=2');

      await fireEvent.click(screen.getByRole('button', { name: 'Sort by seats' }));

      expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
      expect(String(replaceStateSpy.mock.lastCall?.[2])).toContain('page=1');
      expect(String(replaceStateSpy.mock.lastCall?.[2])).toContain('sort=seats');
    } finally {
      if (typeof originalReplaceState !== 'function') {
        Object.defineProperty(window.history, 'replaceState', {
          configurable: true,
          value: originalReplaceState
        });
      }
    }
  });
});
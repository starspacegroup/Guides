import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

export interface ThemeStore {
  current: Theme;
}

function createThemeStore() {
  const { subscribe, set, update } = writable<ThemeStore>({
    current: 'dark' // default
  });

  return {
    subscribe,
    set: (theme: Theme) => {
      set({ current: theme });
      if (browser) {
        document.documentElement.setAttribute('data-theme', theme);
        // Save to cookie
        fetch('/api/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme })
        }).catch(err => console.error('Failed to save theme:', err));
      }
    },
    toggle: () => {
      update(state => {
        const newTheme: Theme = state.current === 'dark' ? 'light' : 'dark';
        if (browser) {
          document.documentElement.setAttribute('data-theme', newTheme);
          // Save to cookie
          fetch('/api/theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: newTheme })
          }).catch(err => console.error('Failed to save theme:', err));
        }
        return { current: newTheme };
      });
    },
    initialize: (theme: Theme) => {
      set({ current: theme });
      if (browser) {
        document.documentElement.setAttribute('data-theme', theme);
      }
    }
  };
}

export const theme = createThemeStore();

/**
 * Get the preferred theme from browser/OS settings
 */
export function getSystemTheme(): Theme {
  if (browser && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return 'dark'; // default fallback
}

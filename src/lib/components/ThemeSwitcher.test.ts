import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';
import { resolvedTheme, systemTheme, themePreference } from '$lib/stores/theme';

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    themePreference.set('system');
    systemTheme.set('light');
  });

  it('renders the switcher button with the fixed variant by default', () => {
    render(ThemeSwitcher);

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
    expect(button.classList.contains('fixed')).toBe(true);
  });

  it('toggles between light and dark preferences in simple toggle mode', async () => {
    themePreference.set('light');
    render(ThemeSwitcher, { props: { simpleToggle: true, variant: 'inline' } });

    const button = screen.getByRole('button', { name: /toggle theme/i });
    await fireEvent.click(button);
    expect(get(themePreference)).toBe('dark');

    await fireEvent.click(button);
    expect(get(themePreference)).toBe('light');
  });

  it('cycles light, dark, and system preferences in full mode', async () => {
    render(ThemeSwitcher, { props: { variant: 'dropdown' } });

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(get(themePreference)).toBe('system');

    await fireEvent.click(button);
    expect(get(themePreference)).toBe('light');

    await fireEvent.click(button);
    expect(get(themePreference)).toBe('dark');

    await fireEvent.click(button);
    expect(get(themePreference)).toBe('system');
    expect(button.classList.contains('dropdown')).toBe(true);
  });

  it('persists the selected theme preference to localStorage', async () => {
    render(ThemeSwitcher, { props: { simpleToggle: true } });

    const button = screen.getByRole('button', { name: /toggle theme/i });
    await fireEvent.click(button);

    expect(localStorage.getItem('theme-preference')).toBe('dark');
  });

  it('resolves the active theme from the system preference by default', () => {
    systemTheme.set('dark');
    render(ThemeSwitcher, { props: { simpleToggle: true } });

    expect(get(themePreference)).toBe('system');
    expect(get(resolvedTheme)).toBe('dark');
    expect(screen.getByRole('button', { name: /toggle theme/i })).toHaveAttribute(
      'title',
      'Toggle light mode'
    );
  });
});

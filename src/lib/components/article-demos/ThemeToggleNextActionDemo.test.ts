import ThemeToggleNextActionDemo from '$lib/components/article-demos/ThemeToggleNextActionDemo.svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

describe('ThemeToggleNextActionDemo', () => {
	it('uses preview-specific theme tokens instead of inheriting the page theme', async () => {
		document.documentElement.setAttribute('data-theme', 'dark');

		try {
			const { container } = render(ThemeToggleNextActionDemo);
			const preview = container.querySelector('[data-header-demo="theme-toggle-next-action"]');

			expect(preview).toHaveAttribute('data-preview-theme', 'light');
			expect(preview?.getAttribute('style')).toContain(
				'--demo-frame-background: var(--color-demo-theme-toggle-light-frame-background)'
			);
			expect(preview?.getAttribute('style')).toContain(
				'--demo-icon-foreground: var(--color-demo-theme-toggle-light-icon-foreground)'
			);
			expect(preview?.getAttribute('style')).toContain(
				'--demo-menu-surface: var(--color-demo-theme-toggle-light-menu-surface)'
			);
			expect(preview?.getAttribute('style')).toContain(
				'--demo-menu-active-border: var(--color-demo-theme-toggle-light-menu-active-border)'
			);

			await fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));

			expect(preview).toHaveAttribute('data-preview-theme', 'dark');
			expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
			expect(preview?.getAttribute('style')).toContain(
				'--demo-frame-background: var(--color-demo-theme-toggle-dark-frame-background)'
			);
			expect(preview?.getAttribute('style')).toContain(
				'--demo-icon-foreground: var(--color-demo-theme-toggle-dark-icon-foreground)'
			);
			expect(preview?.getAttribute('style')).toContain(
				'--demo-menu-surface: var(--color-demo-theme-toggle-dark-menu-surface)'
			);
			expect(preview?.getAttribute('style')).toContain(
				'--demo-menu-active-border: var(--color-demo-theme-toggle-dark-menu-active-border)'
			);
		} finally {
			document.documentElement.removeAttribute('data-theme');
		}
	});

	it('opens a theme menu and applies a selected preference', async () => {
		render(ThemeToggleNextActionDemo);

		const trigger = screen.getByRole('button', { name: 'Theme menu' });
		expect(screen.queryByRole('menu', { name: 'Theme options' })).not.toBeInTheDocument();

		await fireEvent.click(trigger);

		expect(screen.getByRole('menu', { name: 'Theme options' })).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('menuitemradio', { name: 'System mode' }));

		expect(screen.queryByRole('menu', { name: 'Theme options' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
	});
});
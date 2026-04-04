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

			await fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));

			expect(preview).toHaveAttribute('data-preview-theme', 'dark');
			expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
			expect(preview?.getAttribute('style')).toContain(
				'--demo-frame-background: var(--color-demo-theme-toggle-dark-frame-background)'
			);
			expect(preview?.getAttribute('style')).toContain(
				'--demo-icon-foreground: var(--color-demo-theme-toggle-dark-icon-foreground)'
			);
		} finally {
			document.documentElement.removeAttribute('data-theme');
		}
	});
});
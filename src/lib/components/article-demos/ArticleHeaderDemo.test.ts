import ArticleHeaderDemo from '$lib/components/article-demos/ArticleHeaderDemo.svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

describe('ArticleHeaderDemo', () => {
	it('renders the theme toggle demo when requested', () => {
		render(ArticleHeaderDemo, { demo: 'theme-toggle-next-action' });

		expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
	});

	it('renders the modal dialog demo when requested', () => {
		render(ArticleHeaderDemo, { demo: 'modal-dialog-focus-and-close' });

		expect(screen.getByRole('button', { name: 'Open modal example' })).toBeInTheDocument();
	});

	it('renders nothing for an unknown demo', () => {
		const { container } = render(ArticleHeaderDemo, { demo: 'unknown-demo' });

		expect(container.innerHTML).toBe('');
	});
});
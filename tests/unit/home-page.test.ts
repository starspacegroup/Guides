import { contentTypeRegistry } from '$lib/cms/registry';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from '../../src/routes/+page.svelte';

describe('Home page', () => {
	it('renders public guide copy instead of CMS authoring instructions', () => {
		render(Page);

		expect(
			screen.getByRole('heading', {
				level: 1,
				name: /software guides for the systems \*space ships/i
			})
		).toBeTruthy();
		expect(screen.getByText(/browse the guide library by topic/i)).toBeTruthy();
		expect(screen.queryByText(/publish practical guides/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/create a section/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/write a guide/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/publish to url/i)).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /manage sections/i })).not.toBeInTheDocument();
	});

	it('renders a browse card for each registered guide type', () => {
		render(Page);

		for (const contentType of contentTypeRegistry) {
			expect(screen.getByRole('heading', { level: 2, name: contentType.name })).toBeTruthy();
			expect(screen.getByText(contentType.description)).toBeTruthy();

			const browseLink = screen.getByRole('link', {
				name: new RegExp(`browse ${contentType.name}`, 'i')
			});

			expect(browseLink).toHaveAttribute('href', contentType.settings.routePrefix);
			expect(screen.getByText(contentType.settings.routePrefix)).toBeTruthy();
		}
	});
});


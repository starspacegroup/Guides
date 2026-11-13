import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from '../../src/routes/[contentType]/+page.svelte';

const contentType = {
	id: 'type-1',
	slug: 'security',
	name: 'Auth & Security',
	description: 'Sessions and access checks',
	icon: 'shield',
	settings: { routePrefix: '/security', hasTags: true }
};

const item = (index: number) => ({
	id: `item-${index}`,
	slug: `guide-${index}`,
	title: `Guide ${index}`,
	status: 'published',
	fields: { excerpt: 'Summary' },
	publishedAt: null
});

describe('Content type list page count', () => {
	it('counts the whole collection, not the page of it on screen', () => {
		render(Page, {
			props: {
				data: {
					contentType,
					items: Array.from({ length: 12 }, (_, index) => item(index)),
					total: 13,
					page: 1,
					totalPages: 2
				} as never
			}
		});

		expect(screen.getByText(/13\s+guides in this collection/i)).toBeInTheDocument();
	});

	it('falls back to the items it was given when no total is supplied', () => {
		render(Page, {
			props: { data: { contentType, items: [item(1)], page: 1, totalPages: 1 } as never }
		});

		expect(screen.getByText(/1\s+guide in this collection/i)).toBeInTheDocument();
	});
});

import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from '../../src/routes/+page.svelte';

const guideCollections = [
	{
		name: 'User Interface',
		description: 'Section guides for UI implementation details and design decisions',
		href: '/user-interface',
		icon: 'layout',
		publishedCount: 2,
		items: [
			{ title: 'Theme Toggles', href: '/user-interface/theme-toggles' },
			{ title: 'Command Palette Patterns', href: '/user-interface/command-palette-patterns' }
		]
	}
];

const multipleGuideCollections = [
	...guideCollections,
	{
		name: 'Payments',
		description: 'Guides for payment state handling, reconciliation, and recovery paths',
		href: '/payments',
		icon: 'article',
		publishedCount: 3,
		items: [
			{ title: 'Retry Flows', href: '/payments/retry-flows' },
			{ title: 'Ledger Reconciliation', href: '/payments/ledger-reconciliation' },
			{ title: 'Refund States', href: '/payments/refund-states' }
		]
	}
];

describe('Home page', () => {
	it('renders public guide copy instead of CMS authoring instructions', () => {
		render(Page, { props: { data: { guideCollections } } });

		expect(
			screen.getByRole('heading', {
				level: 1,
				name: /software guides for \*space quality launches/i
			})
		).toBeTruthy();
		expect(
			screen.getByText(/explore a curated library of practical guidance for building the future of software/i)
		).toBeTruthy();
		expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
		expect(screen.queryByText(/publish practical guides/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/create a section/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/write a guide/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/publish to url/i)).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /manage sections/i })).not.toBeInTheDocument();
	});

	it('explains how the library is organized with concrete structure cues', () => {
		render(Page, { props: { data: { guideCollections } } });

		expect(screen.getByText(/what you'll find here/i)).toBeTruthy();
		expect(
			screen.getByText(/each collection brings together working patterns, product decisions, and implementation guidance/i)
		).toBeTruthy();
		expect(screen.getByText(/curated collections/i)).toBeTruthy();
		expect(screen.getByText(/real product patterns/i)).toBeTruthy();
		expect(screen.getByText(/shareable references/i)).toBeTruthy();
		expect(screen.queryByText(/inside the library/i)).not.toBeInTheDocument();
		expect(
			screen.queryByText(/topic-specific collections with their own landing pages/i)
		).not.toBeInTheDocument();
	});

	it('renders only guide collections with published guides and previews real guide titles', () => {
		render(Page, { props: { data: { guideCollections } } });

		expect(screen.getByRole('heading', { level: 2, name: 'User Interface' })).toBeTruthy();
		expect(
			screen.getByText('Section guides for UI implementation details and design decisions')
		).toBeTruthy();
		expect(screen.getAllByText('2 published guides')).toHaveLength(2);
		expect(screen.getByRole('link', { name: 'View collection' })).toHaveAttribute(
			'href',
			'/user-interface'
		);
		expect(screen.getByRole('link', { name: 'Theme Toggles' })).toHaveAttribute(
			'href',
			'/user-interface/theme-toggles'
		);
		expect(screen.getByRole('link', { name: 'Command Palette Patterns' })).toHaveAttribute(
			'href',
			'/user-interface/command-palette-patterns'
		);
		expect(
			screen.getByRole('link', {
				name: /browse user interface/i
			})
		).toHaveAttribute('href', '/user-interface');
		expect(screen.getByRole('link', { name: /start with theme toggles/i })).toHaveAttribute(
			'href',
			'/user-interface/theme-toggles'
		);
		expect(screen.queryByText('/user-interface')).not.toBeInTheDocument();
		expect(screen.queryByRole('heading', { level: 2, name: 'Blog Posts' })).not.toBeInTheDocument();
	});

	it('surfaces section-level collection stats for faster browsing context', () => {
		render(Page, { props: { data: { guideCollections: multipleGuideCollections } } });

		expect(screen.getByText('2 live collections')).toBeTruthy();
		expect(screen.getByText('5 published guides')).toBeTruthy();
		expect(screen.getAllByText(/inside this collection/i)).toHaveLength(2);
	});

	it('renders an empty state when no published guide collections exist', () => {
		render(Page, { props: { data: { guideCollections: [] } } });

		expect(screen.getByText(/published guide collections will appear here/i)).toBeTruthy();
	});
});


import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { goto } from '$app/navigation';

import AdminCmsItemEditorPage from '../../src/routes/admin/cms/[type]/[item]/+page.svelte';

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

function mockMatchMedia(matches: boolean) {
	return vi.fn().mockImplementation((query: string) => ({
		matches,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => true
	}));
}

describe('Admin CMS item editor page', () => {
	const baseData = {
		contentType: {
			id: 'ct-ui-patterns',
			slug: 'ui-patterns',
			name: 'UI Patterns',
			fields: [
				{
					name: 'excerpt',
					label: 'Excerpt',
					type: 'textarea',
					required: true,
					sortOrder: 0,
					helpText: 'Shown on the section listing page'
				},
				{
					name: 'body',
					label: 'Guide Body',
					type: 'richtext',
					required: true,
					sortOrder: 1,
					helpText: 'Compose the full guide in the dedicated canvas.'
				}
			],
			settings: {
				hasDrafts: true,
				hasTags: true,
				hasSEO: true
			}
		},
		item: {
			id: 'seed-item-theme-toggle-action-icons',
			title: 'Theme Toggle Icons Should Signal the Next Theme',
			slug: 'theme-toggle-action-icons',
			status: 'published',
			fields: {
				excerpt: 'Theme toggle buttons should show the icon for the theme the user will switch to.',
				body: '## Should\n\nRespect system theme before a user preference exists.'
			},
			seoTitle: 'Theme toggle guidance',
			seoDescription: 'A better theme toggle editor flow.',
			seoImage: 'https://example.com/theme-toggle.png',
			tags: [{ id: 'tag-guides', name: 'Guides' }]
		},
		tags: [{ id: 'tag-guides', name: 'Guides' }],
		isCreateMode: false
	};

	beforeEach(() => {
		vi.restoreAllMocks();
		vi.stubGlobal('matchMedia', mockMatchMedia(true));
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ success: true })
			})
		);
		document.execCommand = vi.fn(() => true);
	});

	it('renders a full-page editor shell that prioritizes the primary rich text field', () => {
		render(AdminCmsItemEditorPage, {
			props: {
				data: baseData as any
			}
		});

		expect(screen.getByRole('link', { name: /back to ui patterns/i })).toHaveAttribute(
			'href',
			'/admin/cms/ui-patterns'
		);
		expect(screen.getByRole('button', { name: /save changes/i })).toBeTruthy();
		expect(screen.getByRole('textbox', { name: /guide body visual editor/i })).toBeTruthy();
		expect(screen.getByRole('complementary', { name: /entry details/i })).toBeTruthy();
		expect(screen.getByLabelText(/excerpt/i)).toBeTruthy();
		expect(screen.getByLabelText(/slug/i)).toBeTruthy();
		expect(screen.queryByText(/content fields/i)).toBeNull();
	});

	it('saves from the route-level action bar and returns to the content list', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ success: true })
		});
		vi.stubGlobal('fetch', fetchMock);

		render(AdminCmsItemEditorPage, {
			props: {
				data: baseData as any
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith(
				'/api/cms/ui-patterns/seed-item-theme-toggle-action-icons',
				expect.objectContaining({ method: 'PUT' })
			);
			expect(goto).toHaveBeenCalledWith('/admin/cms/ui-patterns');
		});
	});
});
import { describe, expect, it, vi } from 'vitest';
import { load as loadList } from '../../src/routes/admin/cms/[type]/+page.server';
import { load as loadItem } from '../../src/routes/admin/cms/[type]/[item]/+page.server';

const type = (hasTags = false) => ({ slug: 'guides', name: 'Guides', settings: { hasTags } });
const response = (body: unknown, ok = true, status = 200) => ({
	ok,
	status,
	json: async () => body
});

describe('admin CMS page edge behavior', () => {
	it('rejects failed and missing type collections in both pages', async () => {
		for (const load of [loadList, loadItem]) {
			await expect(
				load({
					fetch: vi.fn().mockResolvedValue(response({}, false)),
					params: { type: 'guides', item: 'new' },
					url: new URL('https://example.com')
				} as any)
			).rejects.toMatchObject({ status: 500 });
			await expect(
				load({
					fetch: vi.fn().mockResolvedValue(response({})),
					params: { type: 'guides', item: 'new' },
					url: new URL('https://example.com')
				} as any)
			).rejects.toMatchObject({ status: 404 });
		}
	});

	it.each([
		[404, 404],
		[503, 500]
	])('maps item status %s to %s', async (status, expected) => {
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(response({ types: [type()] }))
			.mockResolvedValueOnce(response({}, false, status));
		await expect(
			loadItem({ fetch, params: { type: 'guides', item: 'item' } } as any)
		).rejects.toMatchObject({ status: expected });
	});

	it('supports create mode and optional tag failures', async () => {
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(response({ types: [type(true)] }))
			.mockRejectedValueOnce(new Error('tags'));
		expect(await loadItem({ fetch, params: { type: 'guides', item: 'new' } } as any)).toMatchObject(
			{ item: null, tags: [], isCreateMode: true }
		);
	});

	it('normalizes missing item and tag payloads', async () => {
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(response({ types: [type(true)] }))
			.mockResolvedValueOnce(response({}))
			.mockResolvedValueOnce(response({}));
		expect(
			await loadItem({ fetch, params: { type: 'guides', item: 'item' } } as any)
		).toMatchObject({ item: null, tags: [] });
	});

	it('keeps list defaults when item and tag requests fail', async () => {
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(response({ types: [type(true)] }))
			.mockResolvedValueOnce(response({}, false))
			.mockRejectedValueOnce(new Error('tags'));
		expect(
			await loadList({
				fetch,
				params: { type: 'guides' },
				url: new URL('https://example.com')
			} as any)
		).toMatchObject({ items: [], tags: [], totalItems: 0, totalPages: 1, currentPage: 1 });
	});

	it('loads list tags with missing response fields', async () => {
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(response({ types: [type(true)] }))
			.mockResolvedValueOnce(response({}))
			.mockResolvedValueOnce(response({}));
		const result = await loadList({
			fetch,
			params: { type: 'guides' },
			url: new URL('https://example.com?status=draft&search=x&page=2')
		} as any);
		expect(result).toMatchObject({
			items: [],
			tags: [],
			filters: { status: 'draft', search: 'x' }
		});
	});
});

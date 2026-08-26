import { describe, expect, it, vi } from 'vitest';
import {
	createContentItem,
	createContentTypeInDB,
	getAllContentTypeSlugs,
	getContentTypes,
	getItemTags,
	getPublicGuideCollections,
	getTagsForType,
	listContentItems,
	reorderContentItems,
	syncContentTypes,
	updateContentItem,
	updateContentTypeInDB
} from '$lib/services/cms';
import { contentTypeRegistry } from '$lib/cms/registry';

function db(first: unknown[] = [], all: unknown[] = []) {
	const statement = { bind: vi.fn(), first: vi.fn(), all: vi.fn(), run: vi.fn() };
	statement.bind.mockReturnValue(statement);
	statement.first.mockImplementation(() => Promise.resolve(first.shift() ?? null));
	statement.all.mockImplementation(() => Promise.resolve(all.shift() ?? {}));
	return { prepare: vi.fn().mockReturnValue(statement), batch: vi.fn(), statement } as any;
}

const type = (overrides: Record<string, unknown> = {}) => ({
	id: 'type',
	slug: 'guides',
	name: 'Guides',
	description: null,
	fields: '[]',
	settings: '{}',
	icon: 'book',
	sort_order: 0,
	is_system: 0,
	purpose: 'guide_section',
	visibility: 'public',
	submission_policy: 'admin_only',
	created_at: '2024-01-01',
	updated_at: '2024-01-01',
	...overrides
});
const item = (overrides: Record<string, unknown> = {}) => ({
	id: 'item',
	content_type_id: 'type',
	slug: 'item',
	title: 'Item',
	status: 'draft',
	fields: '{}',
	seo_title: null,
	seo_description: null,
	seo_image: null,
	author_id: null,
	published_at: null,
	sort_order: 0,
	created_at: '2024-01-01',
	updated_at: '2024-01-01',
	...overrides
});

describe('CMS service edge behavior', () => {
	it('applies safe defaults to minimal registry definitions and absent query results', async () => {
		contentTypeRegistry.push({
			slug: 'minimal',
			name: 'Minimal',
			description: '',
			fields: [],
			settings: {},
			icon: 'document'
		} as any);
		try {
			const database = db([], [{}]);
			await syncContentTypes(database);
			expect(database.batch).toHaveBeenCalled();
		} finally {
			contentTypeRegistry.pop();
		}
	});
	it('handles missing result arrays', async () => {
		expect(await getContentTypes(db())).toEqual([]);
		expect(await getTagsForType(db(), 'type')).toEqual([]);
		expect(await getItemTags(db(), 'item')).toEqual([]);
		expect(await getAllContentTypeSlugs(db())).toEqual([]);
	});

	it('loads every published guide when no collection limit is requested', async () => {
		const database = db(
			[{ count: 2 }, { count: 2 }],
			[
				{ results: [] },
				{ results: [type()] },
				{ results: [item({ status: 'published', published_at: '2024-01-01' })] },
				{
					results: [
						item({ status: 'published', published_at: '2024-01-01' }),
						item({ id: 'two', slug: 'two', status: 'published' })
					]
				}
			]
		);
		const collections = await getPublicGuideCollections(database, null);
		expect(collections[0]).toMatchObject({ href: '/guides', description: '', publishedCount: 2 });
	});

	it('covers publication, duplicate slugs, missing sort order, and invalid field schemas', async () => {
		const database = db([type({ fields: '{}' }), null, { id: 'duplicate' }, null]);
		expect(
			await createContentItem(database, {
				contentTypeSlug: 'guides',
				title: 'Published',
				status: 'published',
				fields: {},
				seoTitle: '',
				seoDescription: '',
				seoImage: '',
				authorId: ''
			})
		).toBeNull();
	});

	it('sets tags after a successful item insert', async () => {
		const database = db([type({ fields: '' }), { next_sort_order: 2 }, null, item()]);
		database.batch.mockResolvedValue([]);
		expect(
			await createContentItem(database, {
				contentTypeSlug: 'guides',
				title: 'Item',
				fields: {},
				tagIds: ['tag']
			})
		).toBeTruthy();
		expect(database.batch).toHaveBeenCalled();
	});

	it('applies all list filters and safe sort fallbacks', async () => {
		const database = db([null], [{}]);
		const result = await listContentItems(database, 'type', {
			status: 'draft',
			authorId: 'author',
			search: 'term',
			sortBy: 'DROP TABLE',
			sortDirection: 'sideways' as any
		});
		expect(result).toMatchObject({ items: [], total: 0, page: 1, pageSize: 12, totalPages: 0 });
		expect(database.prepare).toHaveBeenCalledWith(
			expect.stringContaining('ORDER BY created_at DESC')
		);
	});

	it('rejects empty and unverified reorder operations', async () => {
		expect(await reorderContentItems(db(), 'type', [])).toBe(false);
		expect(await reorderContentItems(db([null]), 'type', ['item'])).toBe(false);
	});

	it('handles null update rows', async () => {
		expect(await updateContentItem(db([item(), null]), 'item', { fields: {} })).toBeNull();
	});

	it('uses content type defaults and handles a null insert result', async () => {
		expect(
			await createContentTypeInDB(db([null, null, null]), { name: 'Custom' } as any)
		).toBeNull();
	});

	it('updates every optional content type property', async () => {
		const result = await updateContentTypeInDB(db([type()]), 'type', {
			name: 'New',
			slug: 'new',
			description: null,
			icon: 'star',
			purpose: 'general',
			visibility: 'private',
			submissionPolicy: 'admin_only',
			fields: [],
			settings: {}
		} as any);
		expect(result?.name).toBe('Guides');
	});
});

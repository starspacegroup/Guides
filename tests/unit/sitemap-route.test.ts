import { beforeEach, describe, expect, it, vi } from 'vitest';

const cms = vi.hoisted(() => ({
	syncContentTypes: vi.fn(),
	getContentTypes: vi.fn(),
	listContentItems: vi.fn()
}));
vi.mock('$lib/services/cms', () => cms);

import { GET } from '../../src/routes/sitemap.xml/+server';

const call = (platform: unknown) => GET({ platform } as never) as Promise<Response>;

describe('GET /sitemap.xml', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		cms.syncContentTypes.mockResolvedValue(undefined);
		cms.getContentTypes.mockResolvedValue([
			{ id: 'a', slug: 'launch', visibility: 'public', settings: {} },
			{ id: 'b', slug: 'secret', visibility: 'private', settings: {} },
			{ id: 'c', slug: 'hidden', visibility: 'public', settings: { isPublic: false } },
			{ id: 'd', slug: 'empty', visibility: 'public', settings: {} }
		]);
		cms.listContentItems.mockImplementation(async (_db: unknown, id: string) =>
			id === 'a'
				? { items: [{ slug: 'intro', updatedAt: '2026-01-01T00:00:00Z' }, { slug: 'next', updatedAt: '' }], total: 2 }
				: { items: [], total: 0 }
		);
	});

	it('serves XML with caching headers and only public clean URLs', async () => {
		const res = await call({ env: { DB: {} } });
		expect(res.headers.get('Content-Type')).toContain('application/xml');
		expect(res.headers.get('Cache-Control')).toContain('max-age=3600');
		const xml = await res.text();
		expect(xml).toContain('<loc>https://guides.starspace.group/launch/intro</loc>');
		expect(xml).toContain('<loc>https://guides.starspace.group/privacy</loc>');
		expect(xml.replace(/^<\?xml[^>]*>/, '')).not.toContain('?');
		expect(xml).not.toContain('secret');
		expect(xml).not.toContain('hidden');
		expect(xml).not.toContain('/empty');
		expect(xml).not.toContain('/admin');
	});

	it('still lists static pages without a database', async () => {
		const xml = await (await call(undefined)).text();
		expect(xml).toContain('<loc>https://guides.starspace.group/terms</loc>');
	});

	it('returns 503 uncached when the database fails', async () => {
		cms.getContentTypes.mockRejectedValue(new Error('boom'));
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const res = await call({ env: { DB: {} } });
		expect(res.status).toBe(503);
		expect(res.headers.get('Cache-Control')).toBe('no-store');
	});
});

/**
 * /sitemap.xml - public pages only, clean URLs (no query strings).
 */
import { getContentTypes, listContentItems, syncContentTypes } from '$lib/services/cms';
import { buildSitemapXml, type SitemapEntry } from '$lib/utils/seo';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const entries: SitemapEntry[] = [{ path: '/' }, { path: '/privacy' }, { path: '/terms' }];

	const db = platform?.env?.DB;
	if (db) {
		try {
			await syncContentTypes(db);
			const types = await getContentTypes(db);
			for (const type of types) {
				if (type.visibility !== 'public' || type.settings.isPublic === false) continue;
				const prefix = type.settings.routePrefix || `/${type.slug}`;
				const first = await listContentItems(db, type.id, {
					status: 'published',
					page: 1,
					pageSize: 1
				});
				if (first.total === 0) continue;
				const all =
					first.total > 1
						? await listContentItems(db, type.id, {
								status: 'published',
								page: 1,
								pageSize: first.total,
								sortBy: 'slug',
								sortDirection: 'asc'
							})
						: first;
				entries.push({ path: prefix });
				for (const item of all.items) {
					entries.push({ path: `${prefix}/${item.slug}`, lastmod: item.updatedAt });
				}
			}
		} catch (err) {
			console.error('sitemap: failed to load content', err);
			return new Response('Sitemap temporarily unavailable', {
				status: 503,
				headers: { 'Retry-After': '300', 'Cache-Control': 'no-store' }
			});
		}
	}

	return new Response(buildSitemapXml(entries), {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600'
		}
	});
};

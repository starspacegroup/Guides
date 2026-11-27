/**
 * SEO helpers: canonical URLs and sitemap generation.
 *
 * Canonical URLs are always absolute, built from the site's real origin plus the
 * pathname only, so `?tag=` / `?search=` / `?page=` variants all point at the base page.
 */

/** The public origin of the site (no trailing slash). */
export const SITE_ORIGIN = 'https://guides.starspace.group';

/** Path prefixes that must never be advertised to search engines. */
const PRIVATE_PREFIXES = ['/admin', '/api', '/auth', '/chat', '/profile', '/reset', '/setup'];

/** True when a pathname belongs to a private/admin/auth area. */
export function isPrivatePath(pathname: string): boolean {
	return PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Absolute clean URL for a pathname: origin + pathname, no query, no hash,
 * no trailing slash except for the root ("https://host/").
 */
export function canonicalUrl(pathname: string): string {
	// Drop anything after ? or # in case a full path-and-query was passed in.
	const bare = pathname.split(/[?#]/, 1)[0];
	let path = bare.startsWith('/') ? bare : `/${bare}`;
	path = path.replace(/\/{2,}/g, '/');
	if (path.length > 1) path = path.replace(/\/+$/, '');
	return `${SITE_ORIGIN}${path}`;
}

export interface SitemapEntry {
	/** Root-relative path, e.g. "/launch/intro". */
	path: string;
	/** ISO date or datetime for <lastmod>. */
	lastmod?: string | null;
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/** Build sitemap XML. Private paths are dropped, URLs are de-duplicated and clean. */
export function buildSitemapXml(entries: SitemapEntry[]): string {
	const seen = new Set<string>();
	const urls: string[] = [];
	for (const entry of entries) {
		const bare = entry.path.split(/[?#]/, 1)[0];
		if (isPrivatePath(bare)) continue;
		const loc = canonicalUrl(bare);
		if (seen.has(loc)) continue;
		seen.add(loc);
		const lastmod = entry.lastmod ? new Date(entry.lastmod) : null;
		const lastmodXml =
			lastmod && !Number.isNaN(lastmod.getTime())
				? `<lastmod>${lastmod.toISOString()}</lastmod>`
				: '';
		urls.push(`<url><loc>${escapeXml(loc)}</loc>${lastmodXml}</url>`);
	}
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

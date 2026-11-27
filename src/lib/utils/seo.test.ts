import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { SITE_ORIGIN, buildSitemapXml, canonicalUrl, isPrivatePath } from './seo';

const segment = fc.stringMatching(/^[a-z0-9-]{1,12}$/);
const pathArb = fc.array(segment, { minLength: 0, maxLength: 4 }).map((s) => '/' + s.join('/'));

/** Strict well-formedness check (happy-dom's DOMParser is lenient HTML, not a validator). */
function assertWellFormed(xml: string): string[] {
	expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true);
	const body = xml.replace(/^<\?xml[^>]*\?>\s*/, '').trim();
	const stack: string[] = [];
	const locs: string[] = [];
	const re = /<(\/?)([a-z]+)([^<>]*)>|([^<>]+)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(body))) {
		if (m[2]) {
			if (m[1]) expect(stack.pop()).toBe(m[2]);
			else stack.push(m[2]);
		} else if (m[4] !== undefined && m[4].trim()) {
			// text node: no raw ampersands or angle brackets
			expect(/&(?!amp;|lt;|gt;|quot;|apos;)/.test(m[4])).toBe(false);
			if (stack[stack.length - 1] === 'loc') locs.push(m[4]);
		}
	}
	expect(stack).toEqual([]);
	expect(body.startsWith('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')).toBe(true);
	return locs;
}

describe('canonicalUrl', () => {
	it('strips the query string', () => {
		expect(canonicalUrl('/launch?tag=trust')).toBe(`${SITE_ORIGIN}/launch`);
		expect(canonicalUrl('/cloudflare?tag=durable-objects')).toBe(`${SITE_ORIGIN}/cloudflare`);
	});

	it('is absolute, query-free and hash-free for any path and query', () => {
		fc.assert(
			fc.property(pathArb, fc.string(), (path, query) => {
				const url = canonicalUrl(`${path}?${query}`);
				expect(url.startsWith(`${SITE_ORIGIN}/`) || url === SITE_ORIGIN).toBe(true);
				expect(url).not.toContain('?');
				expect(url).not.toContain('#');
				expect(url).toBe(canonicalUrl(path));
			})
		);
	});

	it('is idempotent and has no trailing slash except the root', () => {
		fc.assert(
			fc.property(pathArb, (path) => {
				const url = canonicalUrl(path);
				expect(canonicalUrl(new URL(url).pathname)).toBe(url);
				if (new URL(url).pathname !== '/') expect(url.endsWith('/')).toBe(false);
			})
		);
		expect(canonicalUrl('/launch/')).toBe(`${SITE_ORIGIN}/launch`);
		expect(canonicalUrl('/')).toBe(`${SITE_ORIGIN}/`);
	});
});

describe('isPrivatePath', () => {
	it('flags admin/auth/api areas but not public pages', () => {
		for (const p of ['/admin', '/admin/cms', '/auth/login', '/api/cms/x', '/chat', '/profile']) {
			expect(isPrivatePath(p)).toBe(true);
		}
		for (const p of ['/', '/launch', '/privacy', '/administration-guide']) {
			expect(isPrivatePath(p)).toBe(false);
		}
	});
});

describe('buildSitemapXml', () => {
	const entries = [
		{ path: '/' },
		{ path: '/launch?tag=trust' },
		{ path: '/launch/intro', lastmod: '2026-01-02T03:04:05Z' },
		{ path: '/launch/intro' },
		{ path: '/admin/cms' },
		{ path: '/a&b' }
	];

	it('contains no query strings, no private paths, no duplicates', () => {
		const xml = buildSitemapXml(entries);
		const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
		expect(locs).toEqual([
			`${SITE_ORIGIN}/`,
			`${SITE_ORIGIN}/launch`,
			`${SITE_ORIGIN}/launch/intro`,
			`${SITE_ORIGIN}/a&amp;b`
		]);
		expect(locs.some((l) => l.includes('?'))).toBe(false);
	});

	it('is well-formed XML', () => {
		const locs = assertWellFormed(buildSitemapXml(entries));
		expect(locs.length).toBe(4);
	});

	it('is well-formed with no "?" in any loc for arbitrary paths', () => {
		fc.assert(
			fc.property(fc.array(fc.tuple(pathArb, fc.string()), { maxLength: 8 }), (items) => {
				const locs = assertWellFormed(
					buildSitemapXml(items.map(([p, q]) => ({ path: `${p}?${q}` })))
				);
				for (const loc of locs) expect(loc).not.toContain('?');
			})
		);
	});

	it('handles an empty list', () => {
		expect(assertWellFormed(buildSitemapXml([]))).toEqual([]);
	});
});

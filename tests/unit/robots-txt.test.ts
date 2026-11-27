import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const robots = readFileSync(resolve(process.cwd(), 'static/robots.txt'), 'utf8');

describe('static/robots.txt', () => {
	it('lists the sitemap at the canonical origin', () => {
		expect(robots).toContain('Sitemap: https://guides.starspace.group/sitemap.xml');
	});

	it('keeps private surfaces disallowed', () => {
		for (const path of ['/admin/', '/api/', '/auth/', '/profile', '/reset', '/setup']) {
			expect(robots).toContain(`Disallow: ${path}`);
		}
	});

	it('does not block the public site', () => {
		expect(robots).toContain('Allow: /');
		expect(robots).not.toMatch(/^Disallow:\s*\/\s*$/m);
	});
});

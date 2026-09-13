import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import articleSource from '../../src/routes/[contentType]/[slug]/+page.svelte?raw';
import listSource from '../../src/routes/[contentType]/+page.svelte?raw';

// Vite resolves `?raw` on a stylesheet to an empty string, so read it off disk.
const appCss = readFileSync(resolve(process.cwd(), 'src/app.css'), 'utf8');

/**
 * Two bugs made every guide unreadable on a phone, and both are the kind that
 * look fine on a desktop monitor. These pin the fixes.
 */
describe('mobile layout', () => {
	describe('root type scale', () => {
		it('does not hard-code the desktop base font size', () => {
			// `font-size: 22px` on html made every rem 37% larger than the layout
			// assumed, so an h1 rendered at ~60px on a 390px screen.
			expect(appCss).not.toMatch(/html\s*\{[^}]*font-size:\s*22px/);
		});

		it('scales the root font down for narrow viewports and back up for desktop', () => {
			expect(appCss).toMatch(/html\s*\{[^}]*font-size:\s*clamp\(/);
			const clamp = appCss.match(/font-size:\s*clamp\(([^)]*)\)/);
			expect(clamp).not.toBeNull();
			const [min, , max] = clamp![1].split(',').map((part) => part.trim());
			expect(parseFloat(min)).toBeLessThan(22);
			// Desktop must be unchanged at the old base.
			expect(max).toBe('22px');
		});

		it('stops mobile browsers inflating text on top of our own sizing', () => {
			expect(appCss).toMatch(/text-size-adjust:\s*100%/);
		});
	});

	describe('article grid', () => {
		// An implicit `auto` grid track takes its minimum from the item's automatic
		// minimum size. The sidebar's min-content blew the single mobile column out
		// to 1910px inside a 390px viewport, and every descendant inherited it.
		it('gives the article layout an explicit shrinkable column', () => {
			expect(articleSource).toMatch(
				/\.cms-blog-article-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/
			);
		});

		it('gives the inner article grids explicit shrinkable columns too', () => {
			for (const selector of ['.cms-blog-article-main', '.cms-blog-article-copy']) {
				const rule = new RegExp(
					`\\${selector}\\s*\\{[^}]*grid-template-columns:\\s*minmax\\(0,\\s*1fr\\)`
				);
				expect(articleSource).toMatch(rule);
			}
		});

		it('keeps the sidebar from sizing the column by its own content', () => {
			expect(articleSource).toMatch(/\.cms-article-sidebar\s*\{[^}]*min-width:\s*0/);
		});

		it('still uses the two-column layout on wide screens', () => {
			expect(articleSource).toContain('@media (min-width: 900px)');
			expect(articleSource).toMatch(
				/\.cms-blog-article-layout\.has-sidebar\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(15rem,\s*18rem\)/
			);
		});

		it('keeps wide content in its own scroll container rather than stretching the page', () => {
			// Code blocks, tables and the mobile TOC strip are allowed to be wider
			// than the viewport, but only inside something that scrolls.
			expect(articleSource).toMatch(/\.cms-article-toc-list\s*\{[^}]*overflow-x:\s*auto/);
			expect(articleSource).toMatch(/cms-table-scroll[^{]*\)\s*\{[^}]*overflow-x:\s*auto/);
		});
	});

	describe('section index header', () => {
		it('shows the topic motif on phones, not only on desktop', () => {
			expect(listSource).toMatch(/\.cms-list-header-art\s*\{[^}]*display:\s*block/);
			expect(listSource).not.toMatch(/\.cms-list-header-art\s*\{[^}]*display:\s*none/);
		});
	});
});

import { describe, expect, it } from 'vitest';
import { enhanceGuideItem, isSupportedHeaderDemo } from '$lib/cms/guideEnhancements';
import type { ContentItemParsed } from '$lib/cms/types';

function createItem(slug: string, body: string, headerDemo?: string): ContentItemParsed {
	return {
		id: 'item-1',
		contentTypeId: 'type-1',
		slug,
		title: 'Guide title',
		status: 'published',
		fields: {
			body,
			...(headerDemo ? { header_demo: headerDemo } : {})
		},
		seoTitle: null,
		seoDescription: null,
		seoImage: null,
		authorId: null,
		publishedAt: null,
		createdAt: '2026-04-04T00:00:00.000Z',
		updatedAt: '2026-04-04T00:00:00.000Z'
	};
}

describe('guideEnhancements', () => {
	it('injects a modal header demo and code examples for ui-pattern guides', () => {
		const item = createItem(
			'modal-dialog-focus-and-close-behavior',
			'# Rule\n\nDialogs must control focus.'
		);

		const enhanced = enhanceGuideItem('ui-patterns', item);

		expect(enhanced.fields.header_demo).toBe('modal-dialog-focus-and-close');
		expect(String(enhanced.fields.body)).toContain('# Code Examples');
		expect(String(enhanced.fields.body)).toContain('Open modal');
	});

	it('does not duplicate code examples when the guide already has them', () => {
		const item = createItem(
			'theme-toggle-action-icons',
			'# Rule\n\nTheme toggles should preview the next action.\n\n# Code Examples\n\n## Svelte',
			'theme-toggle-next-action'
		);

		const enhanced = enhanceGuideItem('ui-patterns', item);

		expect(String(enhanced.fields.body).match(/# Code Examples/g)?.length).toBe(1);
		expect(enhanced.fields.header_demo).toBe('theme-toggle-next-action');
	});

	it('recognizes the supported header demo values', () => {
		expect(isSupportedHeaderDemo('tooltip-vs-popover')).toBe(true);
		expect(isSupportedHeaderDemo('unknown-demo')).toBe(false);
	});
});
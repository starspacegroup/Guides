import { describe, expect, it } from 'vitest';
import { getGuideTopic, guideTopics, resolveGuideVisual } from './guideVisuals';

describe('resolveGuideVisual', () => {
	it('falls back to the general topic when nothing matches', () => {
		const visual = resolveGuideVisual({ title: 'Untitled', slug: 'untitled' });

		expect(visual.topic.id).toBe('general');
		expect(visual.secondary).toEqual([]);
	});

	// The real section that prompted this: eight guides, six of them starting
	// with "Theme" or "Command Palette", each needing its own art.
	it.each([
		['Theme Mode Resolution: Light, Dark, and System', 'theme-mode-resolution', 'theming'],
		['Theme Token Architecture with CSS Variables', 'theme-token-architecture', 'tokens'],
		[
			'Command Palette Architecture for Product Teams',
			'command-palette-architecture',
			'command-palette'
		],
		[
			'Cross-Platform Keyboard Shortcuts in SvelteKit',
			'cross-platform-keyboard-shortcuts',
			'keyboard'
		],
		['Theme Regression Testing Strategy', 'theme-regression-testing', 'testing'],
		['Theme System Hardening Checklist', 'theme-system-hardening-checklist', 'checklist']
	])('reads %s as the %s topic', (title, slug, expected) => {
		expect(resolveGuideVisual({ title, slug }).topic.id).toBe(expected);
	});

	it('prefers the subject over the angle, and keeps the angle as a secondary topic', () => {
		const visual = resolveGuideVisual({
			title: 'Command Palette Accessibility and Interaction Quality',
			slug: 'command-palette-accessibility',
			summary: 'Accessibility and interaction quality standards for command palettes.'
		});

		expect(visual.topic.id).toBe('command-palette');
		expect(visual.secondary.map((topic) => topic.id)).toContain('accessibility');
	});

	it('weighs the title above the summary', () => {
		const visual = resolveGuideVisual({
			title: 'Shipping a Deployment Pipeline',
			slug: 'shipping-a-deployment-pipeline',
			// Mentions testing, but the guide is not about testing.
			summary: 'Covers testing along the way.'
		});

		expect(visual.topic.id).toBe('deployment');
	});

	it('matches word stems but not words that merely start the same way', () => {
		expect(
			resolveGuideVisual({ title: 'Regression Tests', slug: 'regression-tests' }).topic.id
		).toBe('testing');
		// "Contentious" must not read as the content topic.
		expect(
			resolveGuideVisual({ title: 'Contentious Naming', slug: 'contentious-naming' }).topic.id
		).not.toBe('content');
	});

	it('never returns more than two secondary topics', () => {
		const visual = resolveGuideVisual({
			title: 'Theme Tokens, Testing, Accessibility, Performance and Deployment',
			slug: 'everything',
			summary: 'forms tables notifications routing layout security'
		});

		expect(visual.secondary.length).toBeLessThanOrEqual(2);
		expect(visual.secondary).not.toContainEqual(visual.topic);
	});

	it('uses the section only as a hint, never as an override', () => {
		const visual = resolveGuideVisual({
			title: 'Focus Management for Screen Readers',
			slug: 'focus-management-screen-readers',
			contentTypeSlug: 'cloudflare',
			contentTypeName: 'Cloudflare'
		});

		expect(visual.topic.id).toBe('accessibility');
	});
});

describe('guide topics', () => {
	it('gives every topic a label, an accent and an ink', () => {
		for (const topic of [...guideTopics, getGuideTopic('general')]) {
			expect(topic.label).toBeTruthy();
			expect(topic.accent).toMatch(/^#[0-9a-f]{6}$/);
			expect(['light', 'dark']).toContain(topic.ink);
		}
	});

	it('has no duplicate ids or accents', () => {
		const ids = guideTopics.map((topic) => topic.id);
		const accents = guideTopics.map((topic) => topic.accent);

		expect(new Set(ids).size).toBe(ids.length);
		expect(new Set(accents).size).toBe(accents.length);
	});
});

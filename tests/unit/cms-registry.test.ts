import { describe, expect, it } from 'vitest';
import {
	contentTypeRegistry,
	getContentTypeDefinition,
	getRegisteredSlugs,
	isRegisteredContentType,
	userInterfaceContentType
} from '../../src/lib/cms/registry';

describe('CMS Registry', () => {
	describe('contentTypeRegistry', () => {
		it('should contain the default guide section content type', () => {
			expect(contentTypeRegistry.length).toBeGreaterThanOrEqual(1);
			expect(contentTypeRegistry[0].slug).toBe('user-interface');
		});

		it('should have valid content type definitions', () => {
			for (const ct of contentTypeRegistry) {
				expect(ct.slug).toBeTruthy();
				expect(ct.name).toBeTruthy();
				expect(ct.description).toBeTruthy();
				expect(ct.icon).toBeTruthy();
				expect(Array.isArray(ct.fields)).toBe(true);
				expect(ct.settings).toBeTruthy();
			}
		});

		it('should have unique slugs', () => {
			const slugs = contentTypeRegistry.map((ct) => ct.slug);
			const uniqueSlugs = new Set(slugs);
			expect(slugs.length).toBe(uniqueSlugs.size);
		});
	});

	describe('userInterfaceContentType', () => {
		it('should have required fields', () => {
			const requiredFields = userInterfaceContentType.fields.filter((f) => f.required);
			expect(requiredFields.length).toBeGreaterThanOrEqual(2);
			expect(requiredFields.map((f) => f.name)).toContain('excerpt');
			expect(requiredFields.map((f) => f.name)).toContain('body');
		});

		it('should have proper settings', () => {
			expect(userInterfaceContentType.settings.hasDrafts).toBe(true);
			expect(userInterfaceContentType.settings.hasTags).toBe(true);
			expect(userInterfaceContentType.settings.hasSEO).toBe(true);
			expect(userInterfaceContentType.settings.hasAuthor).toBe(true);
			expect(userInterfaceContentType.settings.routePrefix).toBe('/user-interface');
			expect(userInterfaceContentType.purpose).toBe('guide_section');
			expect(userInterfaceContentType.submissionPolicy).toBe('trusted_members');
			expect(userInterfaceContentType.visibility).toBe('public');
		});

		it('should have difficulty options', () => {
			const difficultyField = userInterfaceContentType.fields.find((f) => f.name === 'difficulty');
			expect(difficultyField).toBeTruthy();
			expect(difficultyField!.type).toBe('select');
			expect(difficultyField!.options!.length).toBeGreaterThan(0);
		});
	});

	describe('getContentTypeDefinition', () => {
		it('should return the user interface content type', () => {
			const result = getContentTypeDefinition('user-interface');
			expect(result).toBeTruthy();
			expect(result!.slug).toBe('user-interface');
			expect(result!.name).toBe('User Interface');
		});

		it('should return undefined for unknown slug', () => {
			expect(getContentTypeDefinition('nonexistent')).toBeUndefined();
		});
	});

	describe('getRegisteredSlugs', () => {
		it('should return array of slugs', () => {
			const slugs = getRegisteredSlugs();
			expect(Array.isArray(slugs)).toBe(true);
			expect(slugs).toContain('user-interface');
			expect(slugs).not.toContain('blog');
		});
	});

	describe('isRegisteredContentType', () => {
		it('should return true for registered types', () => {
			expect(isRegisteredContentType('user-interface')).toBe(true);
			expect(isRegisteredContentType('blog')).toBe(false);
		});

		it('should return false for unregistered types', () => {
			expect(isRegisteredContentType('nonexistent')).toBe(false);
		});
	});
});

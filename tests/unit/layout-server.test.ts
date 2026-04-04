import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/services/cms', () => ({
	getPublicGuideCollections: vi.fn().mockResolvedValue([]),
	syncContentTypes: vi.fn().mockResolvedValue(undefined)
}));

/**
 * Tests for Layout Server Load
 * TDD: Tests for root layout data loading
 */

describe('Layout Server Load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	describe('load function', () => {
		it('should return user from locals and check AI providers', async () => {
			const mockUser = {
				id: 'user-123',
				login: 'testuser',
				isAdmin: false
			};

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({ hasProviders: true })
			});

			const { load } = await import('../../src/routes/+layout.server');
			const result = (await load({
				locals: { user: mockUser },
				fetch: mockFetch,
				platform: { env: { DB: {} } }
			} as any)) as { user: typeof mockUser | null; hasAIProviders: boolean; guideCollections: []; };

			expect(result.user).toEqual(mockUser);
			expect(result.hasAIProviders).toBe(true);
			expect(result.guideCollections).toEqual([]);
			expect(mockFetch).toHaveBeenCalledWith('/api/admin/ai-keys/status');
		});

		it('should return null user when not authenticated', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({ hasProviders: false })
			});

			const { load } = await import('../../src/routes/+layout.server');
			const result = (await load({
				locals: {},
				fetch: mockFetch,
				platform: { env: { DB: {} } }
			} as any)) as { user: null; hasAIProviders: boolean; guideCollections: []; };

			expect(result.user).toBeNull();
			expect(result.hasAIProviders).toBe(false);
			expect(result.guideCollections).toEqual([]);
		});

		it('should handle AI provider check failure gracefully', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500
			});

			const { load } = await import('../../src/routes/+layout.server');
			const result = (await load({
				locals: { user: { id: 'user-123' } },
				fetch: mockFetch,
				platform: { env: { DB: {} } }
			} as any)) as { hasAIProviders: boolean; guideCollections: []; };

			expect(result.hasAIProviders).toBe(false);
			expect(result.guideCollections).toEqual([]);
		});

		it('should handle fetch error gracefully', async () => {
			const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

			const { load } = await import('../../src/routes/+layout.server');
			const result = (await load({
				locals: { user: { id: 'user-123' } },
				fetch: mockFetch,
				platform: { env: { DB: {} } }
			} as any)) as { hasAIProviders: boolean; guideCollections: []; };

			expect(result.hasAIProviders).toBe(false);
			expect(result.guideCollections).toEqual([]);
		});

		it('should load all public guides for the command palette', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({ hasProviders: false })
			});
			const mockDb = {};
			const cms = await import('$lib/services/cms');
			const { load } = await import('../../src/routes/+layout.server');

			await load({
				locals: { user: { id: 'user-123' } },
				fetch: mockFetch,
				platform: { env: { DB: mockDb } }
			} as any);

			expect(cms.getPublicGuideCollections).toHaveBeenCalledWith(mockDb, null);
		});
	});
});

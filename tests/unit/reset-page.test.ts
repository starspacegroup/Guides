import { describe, expect, it, vi } from 'vitest';
import { load } from '../../src/routes/reset/+page.server';

describe('reset page security', () => {
	it('is owner-only', async () => {
		await expect(
			load({ locals: { user: { isAdmin: true, isOwner: false } } } as any)
		).rejects.toMatchObject({ status: 403 });
	});

	it('allows the owner when the route is enabled', async () => {
		await expect(
			load({
				locals: { user: { isOwner: true } },
				platform: { env: { KV: { get: vi.fn().mockResolvedValue(null) } } }
			} as any)
		).resolves.toEqual({});
	});
});

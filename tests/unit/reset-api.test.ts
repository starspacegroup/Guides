import { describe, expect, it, vi } from 'vitest';
import { POST } from '../../src/routes/api/reset/+server';

describe('reset API security', () => {
	it('rejects ordinary admins', async () => {
		await expect(
			POST({ locals: { user: { id: 'admin', isAdmin: true, isOwner: false } } } as any)
		).rejects.toMatchObject({ status: 403 });
	});

	it('clears all setup state and revokes sessions for the owner', async () => {
		const remove = vi.fn();
		const run = vi.fn();
		const deleteCookie = vi.fn();
		const response = await POST({
			locals: { user: { id: 'owner', isOwner: true } },
			platform: {
				env: {
					KV: { get: vi.fn().mockResolvedValue(null), delete: remove },
					DB: { prepare: vi.fn(() => ({ run })) }
				}
			},
			cookies: { delete: deleteCookie }
		} as any);
		expect((await response.json()).success).toBe(true);
		expect(remove).toHaveBeenCalledWith('auth_config:discord');
		expect(run).toHaveBeenCalled();
		expect(deleteCookie).toHaveBeenCalledWith('session', { path: '/' });
	});
});

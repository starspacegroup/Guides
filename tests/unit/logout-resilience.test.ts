import { describe, expect, it, vi } from 'vitest';
import { GET as logoutGet, POST as logoutPost } from '../../src/routes/api/auth/logout/+server';
import { signValue } from '$lib/utils/session';

describe('logout resilience', () => {
	function event(withFailingDb: boolean) {
		const statement = {
			bind: vi.fn(),
			run: withFailingDb ? vi.fn().mockRejectedValue(new Error('D1 unavailable')) : vi.fn()
		};
		statement.bind.mockReturnValue(statement);
		const cookies = { get: vi.fn().mockReturnValue(undefined), delete: vi.fn() };
		return {
			cookies,
			platform: { env: { SESSION_SECRET: 'secret', DB: { prepare: () => statement } } }
		} as any;
	}

	it.each([
		['POST', logoutPost],
		['GET', logoutGet]
	])('clears the browser cookie on %s even when revocation fails', async (_method, handler) => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const request = event(true);
		request.cookies.get.mockReturnValue(await signValue({ token: 'opaque' }, 'secret'));

		await expect(handler(request)).rejects.toMatchObject({
			status: 302,
			location: '/auth/login'
		});
		expect(request.cookies.delete).toHaveBeenCalledWith('session', { path: '/' });
	});

	it('still clears the cookie when there is no database binding', async () => {
		const request = event(false);
		delete request.platform.env.DB;
		await expect(logoutPost(request)).rejects.toMatchObject({ status: 302 });
		expect(request.cookies.delete).toHaveBeenCalledWith('session', { path: '/' });
	});
});

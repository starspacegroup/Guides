import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	create: vi.fn(),
	remove: vi.fn(),
	owner: vi.fn(),
	cookie: vi.fn()
}));
vi.mock('$lib/utils/db', () => ({ createSession: mocks.create, deleteSession: mocks.remove }));
vi.mock('$lib/utils/auth-identity', () => ({ resolveOwnerStatus: mocks.owner }));
vi.mock('$lib/utils/session', () => ({ buildDatabaseSessionCookieHeader: mocks.cookie }));
import { finalizeOAuthLogin } from '$lib/server/oauth-finalization';

function options(user: unknown, overrides: Record<string, unknown> = {}) {
	const statement = { bind: vi.fn(), first: vi.fn().mockResolvedValue(user) };
	statement.bind.mockReturnValue(statement);
	return {
		db: { prepare: vi.fn().mockReturnValue(statement) },
		platform: { env: { KV: { put: vi.fn() }, SESSION_SECRET: 'secret' } },
		url: new URL('https://guides.example/callback'),
		userId: 'user',
		...overrides
	} as any;
}

describe('OAuth login finalization', () => {
	beforeEach(() => {
		mocks.create.mockResolvedValue({ token: 'new-token' });
		mocks.owner.mockResolvedValue(false);
		mocks.cookie.mockResolvedValue('session=signed');
	});

	it('rejects a missing reconciled user', async () => {
		await expect(finalizeOAuthLogin(options(null))).rejects.toThrow('OAuth user missing');
	});

	it.each([
		[{ id: 'user', is_admin: 1 }, false, undefined, '/admin'],
		[{ id: 'user', is_admin: 0 }, false, undefined, '/'],
		[{ id: 'user', is_admin: 0 }, false, 'discord', '/profile?linked=discord'],
		[{ id: 'user', is_admin: 0 }, true, undefined, '/admin']
	] as const)(
		'selects the correct destination',
		async (user, isOwner, linkedProvider, destination) => {
			mocks.owner.mockResolvedValueOnce(isOwner);
			const input = options(user, { linkedProvider });
			const response = await finalizeOAuthLogin(input);
			expect(response.headers.get('location')).toBe(`https://guides.example${destination}`);
			if (isOwner)
				expect(input.platform.env.KV.put).toHaveBeenCalledWith(
					'admin_first_login_completed',
					'true'
				);
		}
	);

	it('rotates the current session during account linking', async () => {
		await finalizeOAuthLogin(options({ id: 'user', is_admin: 0 }, { currentSessionToken: 'old' }));
		expect(mocks.remove).toHaveBeenCalledWith(expect.anything(), 'old');
		expect(mocks.create).toHaveBeenCalledWith(expect.anything(), 'user', 7);
	});
});

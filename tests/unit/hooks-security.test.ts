import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authHandler } from '../../src/hooks.server';
import { findValidSession } from '$lib/utils/db';
import { decodeDatabaseSessionCookie } from '$lib/utils/session';
import { resolveOwnerStatus } from '$lib/utils/auth-identity';

vi.mock('$lib/utils/db', () => ({ findValidSession: vi.fn() }));
vi.mock('$lib/utils/session', () => ({ decodeDatabaseSessionCookie: vi.fn() }));
vi.mock('$lib/utils/auth-identity', () => ({ resolveOwnerStatus: vi.fn() }));

function event(cookie?: string, user: unknown = null) {
	const statement = { bind: vi.fn(), first: vi.fn().mockResolvedValue(user) };
	statement.bind.mockReturnValue(statement);
	return {
		cookies: { get: vi.fn().mockReturnValue(cookie), delete: vi.fn() },
		locals: { user: { id: 'stale' } },
		platform: {
			env: { DB: { prepare: vi.fn().mockReturnValue(statement) }, SESSION_SECRET: 'secret' }
		}
	} as any;
}

describe('request authentication hook', () => {
	const resolve = vi.fn().mockResolvedValue(new Response('ok'));

	beforeEach(() => {
		vi.mocked(decodeDatabaseSessionCookie).mockResolvedValue('token');
		vi.mocked(findValidSession).mockResolvedValue({ user_id: 'user' } as any);
		vi.mocked(resolveOwnerStatus).mockResolvedValue(false);
	});

	it('leaves requests without a session cookie alone', async () => {
		const request = event();
		await authHandler({ event: request, resolve } as any);
		expect(decodeDatabaseSessionCookie).not.toHaveBeenCalled();
		expect(resolve).toHaveBeenCalledWith(request);
	});

	it.each([
		['missing database', (request: any) => delete request.platform.env.DB],
		['invalid cookie', () => vi.mocked(decodeDatabaseSessionCookie).mockResolvedValueOnce(null)],
		['revoked session', () => vi.mocked(findValidSession).mockResolvedValueOnce(null)]
	])('clears a %s session', async (_label, arrange) => {
		const request = event('cookie');
		arrange(request);
		await authHandler({ event: request, resolve } as any);
		expect(request.locals.user).toBeUndefined();
		expect(request.cookies.delete).toHaveBeenCalledWith('session', { path: '/' });
	});

	it('clears a session whose user no longer exists', async () => {
		const request = event('cookie');
		await authHandler({ event: request, resolve } as any);
		expect(request.locals.user).toBeUndefined();
	});

	it('reloads identity and privileges from D1 for every request', async () => {
		const request = event('cookie', {
			id: 'user',
			email: 'person@example.com',
			name: null,
			github_login: null,
			github_avatar_url: null,
			is_admin: 1
		});
		vi.mocked(resolveOwnerStatus).mockResolvedValueOnce(true);
		await authHandler({ event: request, resolve } as any);
		expect(request.locals.user).toMatchObject({
			id: 'user',
			login: 'person',
			isAdmin: true,
			isOwner: true
		});
	});

	it('uses provider profile fields for ordinary users', async () => {
		const request = event('cookie', {
			id: 'user',
			email: 'person@example.com',
			name: 'Person',
			github_login: 'person-gh',
			github_avatar_url: 'https://example.com/avatar',
			is_admin: 0
		});
		await authHandler({ event: request, resolve } as any);
		expect(request.locals.user).toMatchObject({
			login: 'person-gh',
			name: 'Person',
			avatarUrl: 'https://example.com/avatar',
			isAdmin: false
		});
	});
});

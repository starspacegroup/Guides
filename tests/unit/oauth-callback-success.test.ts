import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	verify: vi.fn(),
	consume: vi.fn(),
	decode: vi.fn(),
	credentials: vi.fn(),
	reconcile: vi.fn(),
	finalize: vi.fn(),
	owner: vi.fn()
}));

vi.mock('$lib/utils/oauth-state', () => ({
	verifyOAuthTransaction: mocks.verify,
	consumeOAuthTransaction: mocks.consume
}));
vi.mock('$lib/utils/session', () => ({ decodeDatabaseSessionCookie: mocks.decode }));
vi.mock('$lib/utils/auth-provider-config', () => ({
	getAuthProviderCredentials: mocks.credentials
}));
vi.mock('$lib/server/oauth-account', () => ({ reconcileOAuthAccount: mocks.reconcile }));
vi.mock('$lib/server/oauth-finalization', () => ({ finalizeOAuthLogin: mocks.finalize }));
vi.mock('$lib/utils/auth-identity', () => ({ resolveOwnerStatus: mocks.owner }));

import { GET as githubCallback } from '../../src/routes/api/auth/github/callback/+server';
import { GET as discordCallback } from '../../src/routes/api/auth/discord/callback/+server';

function event(provider: string, query = '?code=code&state=state') {
	const statement = { bind: vi.fn(), run: vi.fn() };
	statement.bind.mockReturnValue(statement);
	return {
		url: new URL(`https://guides.example/api/auth/${provider}/callback${query}`),
		locals: {},
		cookies: { get: vi.fn().mockReturnValue('session-cookie'), delete: vi.fn() },
		platform: {
			env: {
				DB: { prepare: vi.fn().mockReturnValue(statement) },
				KV: { put: vi.fn() },
				SESSION_SECRET: 'secret'
			}
		}
	} as any;
}

describe.each([
	['github', githubCallback],
	['discord', discordCallback]
] as const)('%s OAuth callback', (provider, callback) => {
	beforeEach(() => {
		mocks.decode.mockResolvedValue('current-token');
		mocks.verify.mockResolvedValue({ intent: 'login' });
		mocks.consume.mockResolvedValue({ intent: 'login' });
		mocks.credentials.mockResolvedValue({ clientId: 'client', clientSecret: 'secret' });
		mocks.finalize.mockResolvedValue(new Response(null, { status: 302 }));
		mocks.owner.mockResolvedValue(true);
		mocks.reconcile.mockImplementation(async (options) => {
			await options.createUser(options.legacyUserId);
			await options.updateUser(options.legacyUserId, provider === 'discord' ? 'legacy' : 'email');
			return { userId: options.legacyUserId };
		});
	});

	it('completes login without persisting provider access tokens', async () => {
		const token = new Response(JSON.stringify({ access_token: 'provider-token' }), { status: 200 });
		const profile =
			provider === 'github'
				? { id: 123, login: 'owner', name: null, email: null, avatar_url: null }
				: { id: '123', username: 'member', global_name: null, email: null };
		vi.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(token)
			.mockResolvedValueOnce(new Response(JSON.stringify(profile), { status: 200 }));
		const request = event(provider);
		const response = await callback(request);
		expect(response.status).toBe(302);
		expect(mocks.reconcile).toHaveBeenCalledWith(
			expect.objectContaining({ provider, email: null })
		);
		expect(request.platform.env.DB.prepare).not.toHaveBeenCalledWith(
			expect.stringMatching(/access_token/i)
		);
	});

	it('completes session-bound account linking', async () => {
		mocks.verify.mockResolvedValueOnce({ intent: 'link', userId: 'current' });
		mocks.consume.mockResolvedValueOnce({ intent: 'link', userId: 'current' });
		mocks.reconcile.mockResolvedValueOnce({ userId: 'current', linkedProvider: provider });
		vi.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ access_token: 'token' }), { status: 200 })
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify(
						provider === 'github'
							? { id: 1, login: 'user', email: 'u@example.com' }
							: { id: '1', username: 'user', email: 'u@example.com' }
					),
					{ status: 200 }
				)
			);
		const request = event(provider);
		request.locals.user = { id: 'current' };
		await callback(request);
		expect(mocks.finalize).toHaveBeenCalledWith(
			expect.objectContaining({ currentSessionToken: 'current-token', linkedProvider: provider })
		);
	});

	it('rejects a linking transaction owned by another session', async () => {
		mocks.verify.mockResolvedValueOnce({ intent: 'link', userId: 'other' });
		const request = event(provider);
		request.locals.user = { id: 'current' };
		await expect(callback(request)).rejects.toMatchObject({
			status: 302,
			location: '/auth/login?error=invalid_state'
		});
	});

	it.each([
		[
			'not configured',
			() => mocks.credentials.mockResolvedValueOnce({}),
			'/auth/login?error=not_configured'
		],
		[
			'token rejection',
			() =>
				vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 401 })),
			'/auth/login?error=token_exchange_failed'
		],
		[
			'missing token',
			() =>
				vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 200 })),
			'/auth/login?error=no_access_token'
		],
		[
			'consumed state',
			() => {
				mocks.consume.mockResolvedValueOnce(null);
				vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
					new Response('{"access_token":"x"}', { status: 200 })
				);
			},
			'/auth/login?error=invalid_state'
		],
		[
			'profile rejection',
			() =>
				vi
					.spyOn(globalThis, 'fetch')
					.mockResolvedValueOnce(new Response('{"access_token":"x"}', { status: 200 }))
					.mockResolvedValueOnce(new Response(null, { status: 500 })),
			'/auth/login?error=user_fetch_failed'
		]
	])('maps %s failures to a safe redirect', async (_label, arrange, location) => {
		arrange();
		await expect(callback(event(provider))).rejects.toMatchObject({ status: 302, location });
	});

	it('hides unexpected callback failures', async () => {
		mocks.credentials.mockRejectedValueOnce(new Error('secret detail'));
		vi.spyOn(console, 'error').mockImplementation(() => {});
		await expect(callback(event(provider))).rejects.toMatchObject({
			status: 302,
			location: '/auth/login?error=oauth_failed'
		});
	});

	it('fails closed on malformed provider profiles', async () => {
		mocks.reconcile.mockClear();
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ access_token: 'provider-token' }), { status: 200 })
			)
			.mockResolvedValueOnce(new Response(JSON.stringify({ id: null }), { status: 200 }));
		await expect(callback(event(provider))).rejects.toMatchObject({
			status: 302,
			location: '/auth/login?error=oauth_failed'
		});
		expect(mocks.reconcile).not.toHaveBeenCalled();
	});

	it('rejects requests without codes or database bindings', async () => {
		await expect(callback(event(provider, '?state=state'))).rejects.toMatchObject({
			location: '/auth/login?error=no_code'
		});
		const request = event(provider);
		delete request.platform.env.DB;
		await expect(callback(request)).rejects.toMatchObject({
			location: '/auth/login?error=oauth_failed'
		});
	});
});

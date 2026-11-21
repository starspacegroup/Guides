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

import { GET as discordCallback } from '../../src/routes/api/auth/discord/callback/+server';

function event() {
	const statement = { bind: vi.fn(), run: vi.fn() };
	statement.bind.mockReturnValue(statement);
	return {
		url: new URL('https://guides.example/api/auth/discord/callback?code=code&state=state'),
		locals: {},
		cookies: { get: vi.fn().mockReturnValue('session-cookie'), delete: vi.fn() },
		platform: {
			env: {
				DB: { prepare: vi.fn().mockReturnValue(statement) },
				KV: { put: vi.fn() },
				SESSION_SECRET: 'secret'
			}
		},
		statement
	} as any;
}

function respondWith(profile: Record<string, unknown>) {
	vi.spyOn(globalThis, 'fetch')
		.mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'token' }), { status: 200 }))
		.mockResolvedValueOnce(new Response(JSON.stringify(profile), { status: 200 }));
}

describe('Discord email verification', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		mocks.decode.mockResolvedValue('current-token');
		mocks.verify.mockResolvedValue({ intent: 'login' });
		mocks.consume.mockResolvedValue({ intent: 'login' });
		mocks.credentials.mockResolvedValue({ clientId: 'client', clientSecret: 'secret' });
		mocks.finalize.mockResolvedValue(new Response(null, { status: 302 }));
		mocks.reconcile.mockImplementation(async (options: any) => {
			await options.createUser(options.legacyUserId);
			return { userId: options.legacyUserId };
		});
	});

	it('refuses to reconcile accounts on an unverified provider email', async () => {
		respondWith({ id: '1', username: 'attacker', email: 'victim@example.com', verified: false });
		await discordCallback(event());
		expect(mocks.reconcile).toHaveBeenCalledWith(expect.objectContaining({ email: null }));
	});

	it('treats a missing verified flag as unverified', async () => {
		respondWith({ id: '1', username: 'attacker', email: 'victim@example.com' });
		await discordCallback(event());
		expect(mocks.reconcile).toHaveBeenCalledWith(expect.objectContaining({ email: null }));
	});

	it('reconciles accounts on a verified provider email', async () => {
		respondWith({ id: '1', username: 'member', email: 'member@example.com', verified: true });
		await discordCallback(event());
		expect(mocks.reconcile).toHaveBeenCalledWith(
			expect.objectContaining({ email: 'member@example.com' })
		);
	});

	it('never stores an unverified email on a newly created user', async () => {
		respondWith({ id: '1', username: 'attacker', email: 'victim@example.com', verified: false });
		const request = event();
		await discordCallback(request);
		const stored = request.statement.bind.mock.calls.flat();
		expect(stored).not.toContain('victim@example.com');
		expect(stored).toContain('attacker@discord.local');
	});

	it('applies the Discord profile on every sign-in: Discord-hosted avatar only', async () => {
		respondWith({
			id: '293484886726279168',
			username: 'ada',
			avatar: 'abcdef0123456789abcdef0123456789',
			email: 'ada@example.com',
			verified: true
		});
		const request = event();
		await discordCallback(request);
		const sql = request.platform.env.DB.prepare.mock.calls.map((call: string[]) => call[0]);
		expect(sql.some((q: string) => q.includes('SET github_avatar_url'))).toBe(true);
		const bound = request.statement.bind.mock.calls.flat();
		expect(bound).toContain(
			'https://cdn.discordapp.com/avatars/293484886726279168/abcdef0123456789abcdef0123456789.png?size=128'
		);
	});

	it('does not let a hostile avatar hash point the picture off Discord', async () => {
		respondWith({ id: '1234567', username: 'x', avatar: '../evil', verified: false });
		const request = event();
		await discordCallback(request);
		const urls = request.statement.bind.mock.calls
			.flat()
			.filter((v: unknown) => typeof v === 'string' && v.startsWith('http'));
		for (const url of urls) expect(url.startsWith('https://cdn.discordapp.com/')).toBe(true);
	});

	it('still signs in when the profile steps throw', async () => {
		respondWith({ id: '1234567', username: 'x', avatar: 'abcdef0123456789abcdef0123456789' });
		const request = event();
		request.statement.run
			.mockRejectedValueOnce(new Error('seed'))
			.mockRejectedValue(new Error('db'));
		mocks.reconcile.mockResolvedValue({ userId: 'u' });
		await discordCallback(request);
		expect(mocks.finalize).toHaveBeenCalled();
	});
});

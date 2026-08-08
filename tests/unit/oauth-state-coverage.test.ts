import { describe, expect, it, vi } from 'vitest';
import {
	consumeOAuthTransaction,
	createOAuthTransaction,
	oauthStateCookieOptions,
	verifyOAuthState,
	verifyOAuthTransaction
} from '$lib/utils/oauth-state';
import { signValue } from '$lib/utils/session';

function database(first: unknown = null) {
	const statement = { bind: vi.fn(), first: vi.fn().mockResolvedValue(first), run: vi.fn() };
	statement.bind.mockReturnValue(statement);
	return { db: { prepare: vi.fn().mockReturnValue(statement) } as any, statement };
}

const payload = (overrides: Record<string, unknown> = {}) => ({
	provider: 'github',
	state: 'state',
	intent: 'login',
	issuedAt: Date.now(),
	...overrides
});

describe('persisted OAuth state', () => {
	it('rejects missing and invalid signed payloads', async () => {
		expect(await verifyOAuthState('github', null, null, 'secret')).toBeNull();
		for (const value of [
			payload({ provider: 'discord' }),
			payload({ state: 'other' }),
			payload({ intent: 'bad' }),
			payload({ issuedAt: 'now' }),
			payload({ issuedAt: Date.now() - 700_000 }),
			payload({ issuedAt: Date.now() + 70_000 }),
			payload({ intent: 'link' })
		]) {
			expect(
				await verifyOAuthState('github', 'state', await signValue(value, 'secret'), 'secret')
			).toBeNull();
		}
	});

	it('accepts valid login and linking payloads', async () => {
		const login = payload();
		expect(
			await verifyOAuthState('github', 'state', await signValue(login, 'secret'), 'secret')
		).toEqual(login);
		const link = payload({ intent: 'link', userId: 'user' });
		expect(
			await verifyOAuthState('github', 'state', await signValue(link, 'secret'), 'secret')
		).toEqual(link);
	});

	it('requires an authenticated session for linking', async () => {
		await expect(
			createOAuthTransaction(database().db, 'github', 'link', undefined, undefined, 'secret')
		).rejects.toThrow('authenticated');
	});

	it('persists login and linking transactions without raw state or session tokens', async () => {
		const login = database();
		const created = await createOAuthTransaction(
			login.db,
			'github',
			'login',
			undefined,
			undefined,
			'secret'
		);
		expect(login.statement.bind).toHaveBeenCalledWith(
			expect.not.stringMatching(created.state),
			'github',
			'login',
			null,
			null,
			expect.any(String)
		);
		const link = database();
		await createOAuthTransaction(link.db, 'discord', 'link', 'user', 'session', 'secret');
		expect(link.statement.bind.mock.calls[0][3]).toBe('user');
		expect(link.statement.bind.mock.calls[0][4]).not.toBe('session');
	});

	it('verifies and consumes one-time login transactions', async () => {
		const source = database();
		const created = await createOAuthTransaction(
			source.db,
			'github',
			'login',
			undefined,
			undefined,
			'secret'
		);
		const cookies = { get: vi.fn().mockReturnValue(created.cookie), delete: vi.fn() };
		const valid = database({ intent: 'login', user_id: null, session_id: null });
		expect(
			await verifyOAuthTransaction(valid.db, 'github', created.state, cookies, 'secret')
		).toMatchObject({ intent: 'login' });
		expect(
			await consumeOAuthTransaction(valid.db, 'github', created.state, cookies, 'secret')
		).toMatchObject({ intent: 'login' });
		expect(cookies.delete).toHaveBeenCalledWith('oauth_state_github', {
			path: '/api/auth/github/callback'
		});
	});

	it('rejects absent, mismatched, and session-swapped records', async () => {
		const link = payload({ intent: 'link', userId: 'user' });
		const cookies = {
			get: vi.fn().mockReturnValue(await signValue(link, 'secret')),
			delete: vi.fn()
		};
		expect(
			await verifyOAuthTransaction(database().db, 'github', 'state', cookies, 'secret', 'session')
		).toBeNull();
		expect(
			await verifyOAuthTransaction(
				database({ intent: 'login' }).db,
				'github',
				'state',
				cookies,
				'secret',
				'session'
			)
		).toBeNull();
		expect(
			await verifyOAuthTransaction(
				database({ intent: 'link', user_id: 'user', session_id: 'wrong' }).db,
				'github',
				'state',
				cookies,
				'secret',
				'session'
			)
		).toBeNull();
	});

	it('uses callback-scoped secure cookie options', () => {
		expect(oauthStateCookieOptions('discord', new URL('https://example.com'))).toMatchObject({
			path: '/api/auth/discord/callback',
			secure: true,
			httpOnly: true
		});
		expect(oauthStateCookieOptions('github', new URL('http://localhost')).secure).toBe(false);
	});
});

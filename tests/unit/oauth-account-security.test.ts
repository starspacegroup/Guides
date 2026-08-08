import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reconcileOAuthAccount } from '$lib/server/oauth-account';
import { mergeAccounts } from '$lib/services/account-merge';

vi.mock('$lib/services/account-merge', () => ({ mergeAccounts: vi.fn() }));

function database(results: {
	linked?: unknown;
	matched?: unknown;
	legacy?: unknown;
	account?: unknown;
}) {
	const run = vi.fn().mockResolvedValue({ success: true });
	const prepare = vi.fn((query: string) => {
		let result = query.includes('provider_account_id = ?')
			? results.linked
			: query.includes('lower(email)')
				? results.matched
				: query.includes('FROM users WHERE id')
					? results.legacy
					: results.account;
		const statement = { bind: vi.fn(), first: vi.fn().mockResolvedValue(result ?? null), run };
		statement.bind.mockReturnValue(statement);
		return statement;
	});
	return { db: { prepare } as any, prepare, run };
}

function options(db: any, overrides: Record<string, unknown> = {}) {
	return {
		db,
		provider: 'github' as const,
		providerAccountId: 'provider-id',
		legacyUserId: 'legacy',
		email: ' Person@Example.com ',
		createUser: vi.fn(),
		updateUser: vi.fn(),
		...overrides
	};
}

describe('OAuth account reconciliation', () => {
	beforeEach(() => {
		vi.mocked(mergeAccounts).mockReset();
	});

	it('merges an existing provider account when linking it to another user', async () => {
		const { db } = database({ linked: { user_id: 'old' } });
		const input = options(db, { linkingUserId: 'current' });
		expect(await reconcileOAuthAccount(input)).toEqual({
			userId: 'current',
			linkedProvider: 'github'
		});
		expect(mergeAccounts).toHaveBeenCalledWith(db, 'old', 'current');
		expect(input.updateUser).toHaveBeenCalledWith('current', 'link');
	});

	it('creates a missing provider account during linking', async () => {
		const { db, run } = database({});
		await reconcileOAuthAccount(options(db, { linkingUserId: 'current' }));
		expect(run).toHaveBeenCalledOnce();
	});

	it('returns an already linked account without changing users', async () => {
		const { db } = database({ linked: { user_id: 'linked' } });
		const input = options(db);
		expect(await reconcileOAuthAccount(input)).toEqual({ userId: 'linked' });
		expect(input.updateUser).not.toHaveBeenCalled();
	});

	it('matches normalized email, merges legacy data, and creates a provider link', async () => {
		const { db, run } = database({ matched: { id: 'email-user' }, legacy: { id: 'legacy' } });
		const input = options(db);
		expect(await reconcileOAuthAccount(input)).toEqual({ userId: 'email-user' });
		expect(mergeAccounts).toHaveBeenCalledWith(db, 'legacy', 'email-user');
		expect(input.updateUser).toHaveBeenCalledWith('email-user', 'email');
		expect(run).toHaveBeenCalledOnce();
	});

	it('reuses a legacy user when no email account matches', async () => {
		const { db } = database({ legacy: { id: 'legacy' }, account: { id: 'account' } });
		const input = options(db, { email: null });
		expect(await reconcileOAuthAccount(input)).toEqual({ userId: 'legacy' });
		expect(input.updateUser).toHaveBeenCalledWith('legacy', 'legacy');
	});

	it('creates a new user and provider account as a final fallback', async () => {
		const { db, run } = database({});
		const input = options(db, { email: null });
		expect(await reconcileOAuthAccount(input)).toEqual({ userId: 'legacy' });
		expect(input.createUser).toHaveBeenCalledWith('legacy');
		expect(run).toHaveBeenCalledOnce();
	});
});

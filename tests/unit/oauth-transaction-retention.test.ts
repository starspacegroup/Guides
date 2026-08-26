import { describe, expect, it, vi } from 'vitest';
import { createOAuthTransaction } from '$lib/utils/oauth-state';

function database(first: unknown = null) {
	const statement = { bind: vi.fn(), first: vi.fn().mockResolvedValue(first), run: vi.fn() };
	statement.bind.mockReturnValue(statement);
	const db = { prepare: vi.fn().mockReturnValue(statement) } as any;
	return { db, statement, sql: () => db.prepare.mock.calls.map(([query]: [string]) => query) };
}

describe('OAuth transaction retention', () => {
	it('drops consumed and expired rows when a new transaction is issued', async () => {
		const { db, sql } = database();
		await createOAuthTransaction(db, 'github', 'login', undefined, undefined, 'secret');
		const prune = sql().find((query: string) => query.startsWith('DELETE FROM oauth_transactions'));
		expect(prune).toBeTruthy();
		expect(prune).toContain('consumed_at IS NOT NULL');
		expect(prune).toContain('datetime(expires_at) <= CURRENT_TIMESTAMP');
	});

	it('issues the transaction even when pruning fails', async () => {
		const statement = {
			bind: vi.fn(),
			run: vi
				.fn()
				.mockRejectedValueOnce(new Error('prune failed'))
				.mockResolvedValue({ success: true })
		};
		statement.bind.mockReturnValue(statement);
		vi.spyOn(console, 'error').mockImplementation(() => {});

		const issued = await createOAuthTransaction(
			{ prepare: vi.fn().mockReturnValue(statement) } as any,
			'github',
			'login',
			undefined,
			undefined,
			'secret'
		);
		expect(issued.state).toBeTruthy();
		expect(issued.cookie).toBeTruthy();
	});
});

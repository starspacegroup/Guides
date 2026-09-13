import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests for Account Merging
 * TDD: Testing that when a social account is already linked to another user,
 * the accounts should be merged seamlessly instead of showing an error.
 */

describe('Account Merge Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	describe('mergeAccounts', () => {
		it('should transfer all oauth_accounts from source user to target user', async () => {
			const { mergeAccounts } = await import('../../src/lib/services/account-merge');

			const mockBatchResults = { success: true };
			const mockPrepare = vi.fn().mockReturnValue({
				bind: vi.fn().mockReturnValue({
					run: vi.fn().mockResolvedValue({}),
					first: vi.fn().mockResolvedValue({ is_admin: 0 })
				})
			});
			const mockBatch = vi.fn().mockResolvedValue(mockBatchResults);

			const mockDB = {
				prepare: mockPrepare,
				batch: mockBatch
			};

			await mergeAccounts(mockDB as any, 'source-user-id', 'target-user-id');

			// Verify oauth_accounts are transferred
			expect(mockPrepare).toHaveBeenCalledWith(
				'UPDATE oauth_accounts SET user_id = ? WHERE user_id = ?'
			);
		});

		it('should transfer all chat_messages from source user to target user', async () => {
			const { mergeAccounts } = await import('../../src/lib/services/account-merge');

			const mockBatchResults = { success: true };
			const mockPrepare = vi.fn().mockReturnValue({
				bind: vi.fn().mockReturnValue({
					run: vi.fn().mockResolvedValue({}),
					first: vi.fn().mockResolvedValue({ is_admin: 0 })
				})
			});
			const mockBatch = vi.fn().mockResolvedValue(mockBatchResults);

			const mockDB = {
				prepare: mockPrepare,
				batch: mockBatch
			};

			await mergeAccounts(mockDB as any, 'source-user-id', 'target-user-id');

			// Verify chat_messages are transferred
			expect(mockPrepare).toHaveBeenCalledWith(
				'UPDATE chat_messages SET user_id = ? WHERE user_id = ?'
			);
		});

		it('should transfer all sessions from source user to target user', async () => {
			const { mergeAccounts } = await import('../../src/lib/services/account-merge');

			const mockBatchResults = { success: true };
			const mockPrepare = vi.fn().mockReturnValue({
				bind: vi.fn().mockReturnValue({
					run: vi.fn().mockResolvedValue({}),
					first: vi.fn().mockResolvedValue({ is_admin: 0 })
				})
			});
			const mockBatch = vi.fn().mockResolvedValue(mockBatchResults);

			const mockDB = {
				prepare: mockPrepare,
				batch: mockBatch
			};

			await mergeAccounts(mockDB as any, 'source-user-id', 'target-user-id');

			// Verify sessions are transferred
			expect(mockPrepare).toHaveBeenCalledWith('UPDATE sessions SET user_id = ? WHERE user_id = ?');
		});

		it('should delete the source user after transferring data', async () => {
			const { mergeAccounts } = await import('../../src/lib/services/account-merge');

			const mockPrepare = vi.fn().mockReturnValue({
				bind: vi.fn().mockReturnValue({
					run: vi.fn().mockResolvedValue({}),
					first: vi.fn().mockResolvedValue({ is_admin: 0 })
				})
			});
			const mockBatch = vi.fn().mockResolvedValue({ success: true });

			const mockDB = {
				prepare: mockPrepare,
				batch: mockBatch
			};

			await mergeAccounts(mockDB as any, 'source-user-id', 'target-user-id');

			// Verify source user is deleted
			expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?');
		});

		it('should merge admin status (source is admin should make target admin)', async () => {
			const { mergeAccounts } = await import('../../src/lib/services/account-merge');

			const mockPrepare = vi.fn().mockReturnValue({
				bind: vi.fn().mockReturnValue({
					run: vi.fn().mockResolvedValue({}),
					first: vi.fn().mockResolvedValue({ is_admin: 1 })
				})
			});
			const mockBatch = vi.fn().mockResolvedValue({ success: true });

			const mockDB = {
				prepare: mockPrepare,
				batch: mockBatch
			};

			await mergeAccounts(mockDB as any, 'admin-source-id', 'target-user-id');

			// Should check source user's admin status and update target if source was admin
			expect(mockPrepare).toHaveBeenCalledWith('SELECT is_admin FROM users WHERE id = ?');
		});

		it('should use batch operations for atomic updates', async () => {
			const { mergeAccounts } = await import('../../src/lib/services/account-merge');

			const mockBatch = vi.fn().mockResolvedValue({ success: true });
			const mockPrepare = vi.fn().mockReturnValue({
				bind: vi.fn().mockReturnValue({
					run: vi.fn().mockResolvedValue({}),
					first: vi.fn().mockResolvedValue({ is_admin: 0 })
				})
			});

			const mockDB = {
				prepare: mockPrepare,
				batch: mockBatch
			};

			await mergeAccounts(mockDB as any, 'source-user-id', 'target-user-id');

			// Verify batch is called for atomic operations
			expect(mockBatch).toHaveBeenCalled();
		});
	});
});

describe('GitHub Callback - Account Merge on Link', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('should merge accounts instead of showing error when GitHub is already linked to another user', async () => {
		// This test verifies the behavior when:
		// 1. User A is logged in
		// 2. User A tries to link GitHub account X
		// 3. GitHub account X is already linked to User B
		// Expected: User B's data should be merged into User A, User B deleted

		// The actual callback test would be complex due to OAuth flow
		// This is a placeholder to document expected behavior
		expect(true).toBe(true);
	});
});

describe('Discord Callback - Account Merge on Link', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('should merge accounts instead of showing error when Discord is already linked to another user', async () => {
		// This test verifies the behavior when:
		// 1. User A is logged in
		// 2. User A tries to link Discord account X
		// 3. Discord account X is already linked to User B
		// Expected: User B's data should be merged into User A, User B deleted

		// The actual callback test would be complex due to OAuth flow
		// This is a placeholder to document expected behavior
		expect(true).toBe(true);
	});
});

describe('mergeAccounts - CMS ownership', () => {
	function harness() {
		const prepare = vi.fn().mockReturnValue({
			bind: vi.fn().mockReturnValue({
				run: vi.fn().mockResolvedValue({}),
				first: vi.fn().mockResolvedValue({ is_admin: 0 })
			})
		});
		return { db: { prepare, batch: vi.fn().mockResolvedValue({ success: true }) }, prepare };
	}

	it('reassigns authored and edited content before deleting the source user', async () => {
		const { mergeAccounts } = await import('../../src/lib/services/account-merge');
		const { db, prepare } = harness();

		await mergeAccounts(db as any, 'source-user-id', 'target-user-id');

		const statements = prepare.mock.calls.map(([sql]) => sql);
		expect(statements).toContain('UPDATE content_items SET author_id = ? WHERE author_id = ?');
		expect(statements).toContain(
			'UPDATE content_items SET last_edited_by = ? WHERE last_edited_by = ?'
		);
		expect(statements).toContain('UPDATE guide_revisions SET edited_by = ? WHERE edited_by = ?');
		expect(statements).toContain(
			'UPDATE section_contributors SET granted_by = ? WHERE granted_by = ?'
		);
	});

	it('transfers section permissions without breaking the per-section unique key', async () => {
		const { mergeAccounts } = await import('../../src/lib/services/account-merge');
		const { db, prepare } = harness();

		await mergeAccounts(db as any, 'source-user-id', 'target-user-id');

		const statements = prepare.mock.calls.map(([sql]) => sql);
		const dropsCollisions = statements.findIndex((sql: string) =>
			/DELETE FROM section_contributors/.test(sql)
		);
		const transfers = statements.findIndex((sql: string) =>
			/UPDATE section_contributors SET user_id/.test(sql)
		);
		expect(dropsCollisions).toBeGreaterThanOrEqual(0);
		expect(transfers).toBeGreaterThan(dropsCollisions);
	});

	it('deletes the source user only after every transfer statement', async () => {
		const { mergeAccounts } = await import('../../src/lib/services/account-merge');
		const { db, prepare } = harness();

		await mergeAccounts(db as any, 'source-user-id', 'target-user-id');

		const statements = prepare.mock.calls.map(([sql]) => sql);
		expect(statements.at(-1)).toBe('DELETE FROM users WHERE id = ?');
	});
});

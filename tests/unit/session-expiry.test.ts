import { describe, expect, it, vi } from 'vitest';
import { cleanupExpiredSessions, findValidSession } from '$lib/utils/db';

function database(first: unknown = null) {
	const statement = { bind: vi.fn(), first: vi.fn().mockResolvedValue(first), run: vi.fn() };
	statement.bind.mockReturnValue(statement);
	const db = { prepare: vi.fn().mockReturnValue(statement) } as any;
	return { db, statement, sql: () => db.prepare.mock.calls.map(([query]: [string]) => query) };
}

describe('session expiry comparison', () => {
	// expires_at is written with Date#toISOString ('2026-01-01T10:00:00.000Z') while SQLite's
	// datetime('now') yields '2026-01-01 10:00:00'. Compared as text, 'T' sorts after the space,
	// so a raw comparison keeps an expired session alive until the end of its expiry day.
	it('normalizes both sides when validating a session', async () => {
		const { db, sql } = database({ user_id: 'user' });
		await findValidSession(db, 'token');
		expect(sql()[0]).toContain('datetime(expires_at)');
		expect(sql()[0]).not.toMatch(/[^(]expires_at >/);
	});

	it('normalizes both sides when cleaning up expired sessions', async () => {
		const { db, sql } = database();
		await cleanupExpiredSessions(db);
		expect(sql()[0]).toContain('datetime(expires_at)');
		expect(sql()[0]).not.toMatch(/[^(]expires_at </);
	});
});

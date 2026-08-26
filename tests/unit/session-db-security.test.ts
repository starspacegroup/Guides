import { describe, expect, it, vi } from 'vitest';
import {
	cleanupExpiredSessions,
	createSession,
	createUser,
	deleteSession,
	findUserByEmail,
	findUserById,
	findValidSession
} from '$lib/utils/db';
import {
	buildDatabaseSessionCookieHeader,
	decodeDatabaseSessionCookie,
	hashSessionToken,
	signValue,
	verifySignedValue
} from '$lib/utils/session';

function database(first: unknown = null) {
	const statement = {
		bind: vi.fn(),
		first: vi.fn().mockResolvedValue(first),
		run: vi.fn().mockResolvedValue({ success: true })
	};
	statement.bind.mockReturnValue(statement);
	return { db: { prepare: vi.fn().mockReturnValue(statement) } as any, statement };
}

describe('database sessions', () => {
	it('creates users and rejects an empty insert result', async () => {
		const found = { id: 'user', email: 'u@example.com' };
		const success = database(found);
		expect(await createUser(success.db, found.email)).toBe(found);
		expect(success.statement.bind).toHaveBeenCalledWith(expect.any(String), found.email, null);
		await expect(createUser(database().db, found.email, 'User')).rejects.toThrow(
			'Failed to create user'
		);
	});

	it('finds users through parameterized statements', async () => {
		const byEmail = database({ id: 'email' });
		const byId = database({ id: 'id' });
		expect(await findUserByEmail(byEmail.db, 'u@example.com')).toEqual({ id: 'email' });
		expect(byEmail.statement.bind).toHaveBeenCalledWith('u@example.com');
		expect(await findUserById(byId.db, 'id')).toEqual({ id: 'id' });
	});

	it('stores only a digest and hashes lookup and deletion tokens', async () => {
		const created = database();
		const session = await createSession(created.db, 'user', 1);
		expect(session.token).not.toBe(session.id);
		expect(session.id).toBe(await hashSessionToken(session.token));
		expect(created.statement.bind).toHaveBeenCalledWith(
			session.id,
			'user',
			session.expires_at.toISOString()
		);

		const found = database({ user_id: 'user' });
		expect(await findValidSession(found.db, session.token)).toEqual({ user_id: 'user' });
		expect(found.statement.bind).toHaveBeenCalledWith(session.id);
		const deleted = database();
		await deleteSession(deleted.db, session.token);
		expect(deleted.statement.bind).toHaveBeenCalledWith(session.id);
		const cleaned = database();
		await cleanupExpiredSessions(cleaned.db);
		expect(cleaned.statement.run).toHaveBeenCalledOnce();
	});
});

describe('signed session cookies', () => {
	it('round trips valid values and rejects malformed or tampered values', async () => {
		const signed = await signValue({ token: 'opaque' }, 'secret');
		expect(await verifySignedValue(signed, 'secret')).toEqual({ token: 'opaque' });
		expect(await verifySignedValue(signed, 'wrong')).toBeNull();
		expect(await verifySignedValue(`${signed}.extra`, 'secret')).toBeNull();
		expect(await verifySignedValue('bad.%%%', 'secret')).toBeNull();
		expect(await verifySignedValue(undefined, 'secret')).toBeNull();
		expect(
			await decodeDatabaseSessionCookie(await signValue({ token: 1 }, 'secret'), 'secret')
		).toBeNull();
	});

	it('requires a secret and creates appropriately scoped headers', async () => {
		await expect(
			buildDatabaseSessionCookieHeader('', new URL('https://example.com'), 'secret')
		).rejects.toThrow('empty');
		const secure = await buildDatabaseSessionCookieHeader(
			'token',
			new URL('https://example.com'),
			'secret'
		);
		expect(secure).toContain('HttpOnly');
		expect(secure).toContain('Secure');
		expect(await decodeDatabaseSessionCookie(secure.split(';')[0].slice(8), 'secret')).toBe(
			'token'
		);
		const local = await buildDatabaseSessionCookieHeader(
			'token',
			new URL('http://localhost'),
			'secret'
		);
		expect(local).not.toContain('Secure');
	});
});

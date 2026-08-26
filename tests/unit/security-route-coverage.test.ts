import { describe, expect, it, vi } from 'vitest';
import { POST as revealPii } from '../../src/routes/api/admin/pii-reveal/+server';
import { GET as logoutGet, POST as logoutPost } from '../../src/routes/api/auth/logout/+server';
import { GET as setupGet, POST as setupPost } from '../../src/routes/api/setup/+server';

const owner = { user: { id: 'owner', login: 'owner', email: 'owner@example.com', isOwner: true } };

describe('PII reveal route', () => {
	it('allows only owners to set and clear the short-lived cookie', async () => {
		await expect(
			revealPii({
				locals: {},
				request: { json: async () => ({ reveal: true }) },
				cookies: {}
			} as any)
		).rejects.toMatchObject({ status: 403 });
		const cookies = { set: vi.fn(), delete: vi.fn() };
		expect(
			(
				await revealPii({
					locals: owner,
					request: { json: async () => ({ reveal: true }) },
					cookies
				} as any)
			).status
		).toBe(200);
		expect(cookies.set).toHaveBeenCalledWith(
			'pii_reveal',
			'1',
			expect.objectContaining({ httpOnly: true, sameSite: 'strict' })
		);
		await revealPii({
			locals: owner,
			request: { json: async () => ({ reveal: false }) },
			cookies
		} as any);
		expect(cookies.delete).toHaveBeenCalledWith('pii_reveal', { path: '/' });
	});
});

describe('logout route', () => {
	function event(cookie?: string, withDb = true) {
		const statement = { bind: vi.fn(), run: vi.fn() };
		statement.bind.mockReturnValue(statement);
		return {
			event: {
				cookies: { get: vi.fn().mockReturnValue(cookie), delete: vi.fn() },
				platform: {
					env: {
						SESSION_SECRET: 'secret',
						...(withDb ? { DB: { prepare: vi.fn().mockReturnValue(statement) } } : {})
					}
				}
			} as any,
			statement
		};
	}

	it('revokes valid sessions for GET and clears invalid sessions for POST', async () => {
		const { buildDatabaseSessionCookieHeader } = await import('$lib/utils/session');
		const signed = (
			await buildDatabaseSessionCookieHeader('token', new URL('https://example.com'), 'secret')
		)
			.split(';')[0]
			.slice(8);
		const valid = event(signed);
		await expect(logoutGet(valid.event)).rejects.toMatchObject({
			status: 302,
			location: '/auth/login'
		});
		expect(valid.statement.run).toHaveBeenCalled();
		const invalid = event('invalid', false);
		await expect(logoutPost(invalid.event)).rejects.toMatchObject({ status: 302 });
		expect(invalid.event.cookies.delete).toHaveBeenCalledWith('session', { path: '/' });
	});
});

describe('secure setup route', () => {
	function kv(values: Array<string | null> = []) {
		return {
			get: vi.fn().mockImplementation(() => Promise.resolve(values.shift() ?? null)),
			put: vi.fn()
		};
	}

	it('reports setup state and fails closed without KV', async () => {
		const store = kv(['config', 'owner', 'true']);
		expect(await (await setupGet({ platform: { env: { KV: store } } } as any)).json()).toEqual({
			hasConfig: true,
			hasAdmin: true,
			setupLocked: true
		});
		await expect(setupGet({} as any)).rejects.toMatchObject({ status: 500 });
		await expect(
			setupGet({
				platform: { env: { KV: { get: vi.fn().mockRejectedValue(new Error('KV')) } } }
			} as any)
		).rejects.toMatchObject({ status: 500 });
	});

	it('requires an unused installation, setup secret, and valid payload', async () => {
		const request = (body: unknown, authorization = 'Bearer setup') => ({
			headers: new Headers({ authorization }),
			json: async () => body
		});
		// A complete installation locks. A partial one stays repairable by the setup secret and is
		// covered in setup-recovery.test.ts.
		await expect(
			setupPost({
				platform: { env: { KV: kv(['config', 'owner-id', 'owner-name']) } },
				locals: {}
			} as any)
		).rejects.toMatchObject({ status: 401 });
		await expect(
			setupPost({
				platform: { env: { KV: kv(), SETUP_SECRET: 'setup' } },
				locals: {},
				request: request({})
			} as any)
		).rejects.toMatchObject({ status: 400 });
		await expect(
			setupPost({
				platform: { env: { KV: kv(), SETUP_SECRET: 'setup' } },
				locals: {},
				request: request({ clientId: 'id', clientSecret: 'secret' })
			} as any)
		).rejects.toMatchObject({ status: 400 });
		await expect(
			setupPost({
				platform: { env: { KV: kv(), SETUP_SECRET: 'setup' } },
				locals: {},
				request: request({
					clientId: 'id',
					clientSecret: 'secret',
					provider: 'discord',
					adminGithubUsername: 'owner'
				})
			} as any)
		).rejects.toMatchObject({ status: 400 });
		await expect(
			setupPost({
				platform: { env: { KV: kv(), SETUP_SECRET: 'setup' } },
				locals: {},
				request: request({ clientId: 'id', clientSecret: 'secret', adminGithubUsername: '-bad-' })
			} as any)
		).rejects.toMatchObject({ status: 400 });
	});

	it('persists verified GitHub bootstrap configuration', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(JSON.stringify({ id: 123, login: 'owner' }), { status: 200 })
		);
		const store = kv();
		const response = await setupPost({
			platform: { env: { KV: store, SETUP_SECRET: 'setup' } },
			locals: {},
			request: {
				headers: new Headers({ authorization: 'Bearer setup' }),
				json: async () => ({
					clientId: 'id',
					clientSecret: 'secret',
					adminGithubUsername: ' owner '
				})
			}
		} as any);
		expect((await response.json()).adminId).toBe('123');
		expect(store.put).toHaveBeenCalledTimes(3);
	});

	it.each([404, 500])('maps GitHub status %s safely', async (status) => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status }));
		await expect(
			setupPost({
				platform: { env: { KV: kv(), SETUP_SECRET: 'setup' } },
				locals: {},
				request: {
					headers: new Headers({ authorization: 'Bearer setup' }),
					json: async () => ({
						clientId: 'id',
						clientSecret: 'secret',
						adminGithubUsername: 'owner'
					})
				}
			} as any)
		).rejects.toMatchObject({ status: status === 404 ? 404 : 502 });
	});

	it('hides unexpected setup failures', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network detail'));
		await expect(
			setupPost({
				platform: { env: { KV: kv(), SETUP_SECRET: 'setup' } },
				locals: {},
				request: {
					headers: new Headers({ authorization: 'Bearer setup' }),
					json: async () => ({
						clientId: 'id',
						clientSecret: 'secret',
						adminGithubUsername: 'owner'
					})
				}
			} as any)
		).rejects.toMatchObject({ status: 500 });
	});
});

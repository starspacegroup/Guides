import { describe, expect, it, vi } from 'vitest';
import { signValue } from '$lib/utils/session';
import { GET } from '../../src/routes/api/auth/github/+server';

describe('GitHub OAuth initiation', () => {
	it('redirects when credentials are absent or malformed', async () => {
		await expect(GET({ platform: { env: {} } } as any)).rejects.toMatchObject({
			location: '/setup?error=oauth_not_configured'
		});
		await expect(
			GET({ platform: { env: { KV: { get: vi.fn().mockResolvedValue('{') } } } } as any)
		).rejects.toMatchObject({ location: '/setup?error=oauth_not_configured' });
	});
	it('fails closed without D1', async () => {
		await expect(
			GET({
				url: new URL('http://localhost/api/auth/github'),
				locals: {},
				platform: { env: { GITHUB_CLIENT_ID: 'client' } }
			} as any)
		).rejects.toMatchObject({ status: 302, location: '/auth/login?error=oauth_failed' });
	});

	it('persists state before redirecting', async () => {
		const run = vi.fn();
		const set = vi.fn();
		await expect(
			GET({
				url: new URL('http://localhost/api/auth/github'),
				locals: {},
				cookies: { get: vi.fn(), set },
				platform: {
					env: {
						GITHUB_CLIENT_ID: 'client',
						SESSION_SECRET: 'test-secret',
						DB: { prepare: vi.fn(() => ({ bind: vi.fn(() => ({ run })) })) }
					}
				}
			} as any)
		).rejects.toMatchObject({ status: 302 });
		expect(run).toHaveBeenCalled();
		expect(set).toHaveBeenCalledWith(
			'oauth_state_github',
			expect.any(String),
			expect.objectContaining({ httpOnly: true })
		);
	});

	it('binds account-linking state to the current session', async () => {
		const bind = vi.fn(() => ({ run: vi.fn() }));
		await expect(
			GET({
				url: new URL('https://guides.example/api/auth/github'),
				locals: { user: { id: 'user' } },
				cookies: {
					get: vi.fn().mockReturnValue(await signValue({ token: 'session-token' }, 'secret')),
					set: vi.fn()
				},
				platform: {
					env: {
						GITHUB_CLIENT_ID: 'client',
						SESSION_SECRET: 'secret',
						DB: { prepare: vi.fn(() => ({ bind })) }
					}
				}
			} as any)
		).rejects.toMatchObject({ status: 302 });
		expect(bind).toHaveBeenCalledWith(
			expect.any(String),
			'github',
			'link',
			'user',
			expect.any(String),
			expect.any(String)
		);
	});
});

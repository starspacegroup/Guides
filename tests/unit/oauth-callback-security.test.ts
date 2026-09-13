import { describe, expect, it, vi } from 'vitest';
import { GET as githubCallback } from '../../src/routes/api/auth/github/callback/+server';
import { GET as discordCallback } from '../../src/routes/api/auth/discord/callback/+server';

const event = (provider: string) => ({
	url: new URL(`https://guides.example/api/auth/${provider}/callback?code=code&state=state`),
	locals: {},
	cookies: { get: vi.fn(), delete: vi.fn() },
	platform: {
		env: {
			SESSION_SECRET: 'secret',
			DB: {
				prepare: vi.fn(() => ({ bind: vi.fn(() => ({ first: vi.fn().mockResolvedValue(null) })) }))
			}
		}
	}
});

describe('OAuth callback security', () => {
	it.each([
		['github', githubCallback],
		['discord', discordCallback]
	])(
		'rejects %s callbacks without a persisted one-time transaction',
		async (_provider, callback) => {
			const fetchSpy = vi.spyOn(globalThis, 'fetch');
			await expect(callback(event(_provider) as any)).rejects.toMatchObject({
				status: 302,
				location: '/auth/login?error=invalid_state'
			});
			expect(fetchSpy).not.toHaveBeenCalled();
		}
	);
});

import { describe, expect, it, vi } from 'vitest';
import { GET } from '../../src/routes/api/auth/discord/+server';

describe('Discord OAuth initiation', () => {
	it('fails closed without configuration or D1', async () => {
		await expect(GET({ platform: { env: {} } } as any)).rejects.toMatchObject({
			location: '/setup?error=oauth_not_configured'
		});
		await expect(
			GET({ platform: { env: { DISCORD_CLIENT_ID: 'client' } } } as any)
		).rejects.toMatchObject({ location: '/auth/login?error=oauth_failed' });
	});
	it('persists one-time state and redirects to Discord', async () => {
		const run = vi.fn();
		const set = vi.fn();
		try {
			await GET({
				url: new URL('https://guides.example/api/auth/discord'),
				locals: {},
				cookies: { get: vi.fn(), set },
				platform: {
					env: {
						DISCORD_CLIENT_ID: 'client',
						SESSION_SECRET: 'test-secret',
						DB: { prepare: vi.fn(() => ({ bind: vi.fn(() => ({ run })) })) }
					}
				}
			} as any);
			expect.fail('redirect expected');
		} catch (error: any) {
			expect(error.location).toContain('discord.com');
		}
		expect(run).toHaveBeenCalled();
		expect(set).toHaveBeenCalledWith(
			'oauth_state_discord',
			expect.any(String),
			expect.objectContaining({ secure: true })
		);
	});
});

import { describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../../src/routes/api/admin/auth-keys/+server';

const owner = { user: { id: 'owner', isOwner: true } };

describe('auth keys API security', () => {
	it('is owner-only', async () => {
		await expect(
			GET({ locals: { user: { id: 'admin', isAdmin: true, isOwner: false } } } as any)
		).rejects.toMatchObject({ status: 403 });
	});

	it('lists supported provider configurations without secrets', async () => {
		const get = vi.fn(async (key: string) =>
			key.endsWith('github')
				? JSON.stringify({
						id: 'github-id',
						provider: 'github',
						clientId: 'client',
						clientSecret: 'secret',
						createdAt: '2024-01-01',
						updatedAt: '2024-01-01'
					})
				: null
		);
		const response = await GET({ locals: owner, platform: { env: { KV: { get } } } } as any);
		const body = await response.json();
		expect(body.keys).toEqual([
			expect.objectContaining({ provider: 'github', clientId: 'client' })
		]);
		expect(JSON.stringify(body)).not.toContain('secret');
	});

	it('rejects unsupported providers before writing KV', async () => {
		const put = vi.fn();
		await expect(
			POST({
				locals: owner,
				platform: { env: { KV: { put } } },
				request: new Request('http://localhost/api/admin/auth-keys', {
					method: 'POST',
					body: JSON.stringify({
						name: 'bad',
						provider: 'google',
						clientId: 'id',
						clientSecret: 'secret'
					})
				})
			} as any)
		).rejects.toMatchObject({ status: 400 });
		expect(put).not.toHaveBeenCalled();
	});
});

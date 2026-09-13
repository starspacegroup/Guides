import { describe, expect, it, vi } from 'vitest';
import { DELETE, PUT } from '../../src/routes/api/admin/auth-keys/[id]/+server';

describe('auth key mutation security', () => {
	const owner = {
		user: { id: 'owner', login: 'owner', email: 'owner@example.com', isOwner: true }
	};
	const config = (provider: 'github' | 'discord', id: string, clientSecret = 'existing') =>
		JSON.stringify({
			id,
			provider,
			clientId: 'client',
			clientSecret,
			createdAt: 'old',
			updatedAt: 'old'
		});

	it('rejects ordinary admins', async () => {
		await expect(
			DELETE({ locals: { user: { isAdmin: true, isOwner: false } } } as any)
		).rejects.toMatchObject({ status: 403 });
	});

	it('rejects unsupported provider updates', async () => {
		await expect(
			PUT({
				locals: { user: { isOwner: true } },
				params: { id: 'id' },
				request: { json: vi.fn().mockResolvedValue({ provider: 'google' }) }
			} as any)
		).rejects.toMatchObject({ status: 400 });
	});

	it('validates required update fields', async () => {
		await expect(
			PUT({
				locals: owner,
				params: { id: 'id' },
				request: { json: async () => ({ name: 'Name' }) }
			} as any)
		).rejects.toMatchObject({ status: 400 });
	});

	it('updates provider configuration while preserving secrets', async () => {
		const get = vi
			.fn()
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(config('discord', 'discord-key'));
		const put = vi.fn();
		const response = await PUT({
			locals: owner,
			params: { id: 'discord-key' },
			request: {
				json: async () => ({
					name: 'Discord',
					provider: 'discord',
					type: 'oauth',
					clientId: 'client'
				})
			},
			platform: { env: { KV: { get, put, delete: vi.fn() } } }
		} as any);
		expect(response.status).toBe(200);
		const saved = JSON.parse(put.mock.calls[0][1]);
		expect(saved).toMatchObject({
			id: 'discord-key',
			clientSecret: 'existing',
			updatedBy: 'owner'
		});
	});

	it('includes a replacement client secret when supplied', async () => {
		const kv = { get: vi.fn().mockResolvedValue(null), put: vi.fn(), delete: vi.fn() };
		await PUT({
			locals: owner,
			params: { id: 'discord-key' },
			request: {
				json: async () => ({
					name: 'Discord',
					provider: 'discord',
					clientId: 'client',
					clientSecret: 'new'
				})
			},
			platform: { env: { KV: kv } }
		} as any);
		expect(JSON.parse(kv.put.mock.calls[0][1]).clientSecret).toBe('new');
	});

	it.each([
		['edit', PUT],
		['delete', DELETE]
	])('protects the setup key from %s', async (_action, handler) => {
		const input: any = {
			locals: owner,
			params: { id: 'setup' },
			platform: { env: { KV: { get: vi.fn().mockResolvedValue(config('github', 'setup')) } } }
		};
		if (handler === PUT)
			input.request = {
				json: async () => ({ name: 'GitHub', provider: 'github', clientId: 'client' })
			};
		await expect(handler(input)).rejects.toMatchObject({ status: 403 });
	});

	it('deletes the matching provider configuration', async () => {
		const kv = {
			get: vi
				.fn()
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(config('discord', 'discord-key')),
			delete: vi.fn()
		};
		const response = await DELETE({
			locals: owner,
			params: { id: 'discord-key' },
			platform: { env: { KV: kv } }
		} as any);
		expect(response.status).toBe(200);
		expect(kv.delete).toHaveBeenCalledWith('auth_config:discord');
	});

	it('fails closed when KV is unavailable', async () => {
		await expect(DELETE({ locals: owner, params: { id: 'missing' } } as any)).rejects.toMatchObject(
			{
				status: 500
			}
		);
	});

	it('fails closed when stored configuration is malformed', async () => {
		await expect(
			DELETE({
				locals: owner,
				params: { id: 'id' },
				platform: { env: { KV: { get: vi.fn().mockResolvedValue('{') } } }
			} as any)
		).rejects.toBeInstanceOf(SyntaxError);
	});
});

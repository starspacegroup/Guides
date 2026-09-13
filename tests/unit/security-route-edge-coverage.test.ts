import { describe, expect, it, vi } from 'vitest';
import {
	GET as listAuthKeys,
	POST as createAuthKey
} from '../../src/routes/api/admin/auth-keys/+server';
import { POST as reorder } from '../../src/routes/api/cms/[type]/reorder/+server';
import { POST as reset } from '../../src/routes/api/reset/+server';
import { load as resetPage } from '../../src/routes/reset/+page.server';
import {
	getAuthProviderCredentials,
	parseAuthProviderConfig,
	readAuthProviderSummary
} from '$lib/utils/auth-provider-config';

const owner = { user: { id: 'owner', login: 'owner', email: 'o@example.com', isOwner: true } };

describe('provider credential configuration', () => {
	it('uses environment credentials without reading KV', async () => {
		const get = vi.fn();
		expect(
			await getAuthProviderCredentials(
				{ env: { GITHUB_CLIENT_ID: 'id', GITHUB_CLIENT_SECRET: 'secret', KV: { get } } } as any,
				'github'
			)
		).toEqual({ clientId: 'id', clientSecret: 'secret' });
		expect(get).not.toHaveBeenCalled();
	});

	it('fills partial Discord credentials from stored configuration', async () => {
		const platform = {
			env: {
				DISCORD_CLIENT_ID: 'env-id',
				KV: {
					get: vi.fn().mockResolvedValue('{"clientId":"stored-id","clientSecret":"stored-secret"}')
				}
			}
		} as any;
		expect(await getAuthProviderCredentials(platform, 'discord')).toEqual({
			clientId: 'env-id',
			clientSecret: 'stored-secret'
		});
		expect(
			await getAuthProviderCredentials(
				{ env: { KV: { get: vi.fn().mockResolvedValue(null) } } } as any,
				'github'
			)
		).toEqual({ clientId: undefined, clientSecret: undefined });
	});

	it('validates full mutation configs independently from summaries', async () => {
		const valid = {
			id: 'id',
			provider: 'github',
			clientId: 'client',
			clientSecret: 'secret',
			createdAt: 'created',
			updatedAt: 'updated',
			updatedBy: 'owner'
		};
		expect(parseAuthProviderConfig(JSON.stringify(valid))).toEqual(valid);
		for (const field of ['id', 'provider', 'clientId', 'clientSecret', 'createdAt', 'updatedAt']) {
			expect(parseAuthProviderConfig(JSON.stringify({ ...valid, [field]: null }))).toBeNull();
		}
		const get = vi.fn().mockResolvedValue('{"id":"summary","clientId":"client","createdAt":"now"}');
		expect(await readAuthProviderSummary({ get } as any, 'github')).toEqual({
			id: 'summary',
			clientId: 'client',
			createdAt: 'now'
		});
		expect(() => parseAuthProviderConfig('null')).toThrow(TypeError);
		for (const stored of ['{"id":1,"clientId":"client"}', '{"id":"id","clientId":1}']) {
			expect(
				await readAuthProviderSummary({ get: vi.fn().mockResolvedValue(stored) } as any, 'github')
			).toBeNull();
		}
		expect(
			await getAuthProviderCredentials(
				{
					env: { KV: { get: vi.fn().mockResolvedValue('{"clientId":1,"clientSecret":1}') } }
				} as any,
				'github'
			)
		).toEqual({ clientId: undefined, clientSecret: undefined });
	});
});

describe('auth key collection routes', () => {
	it('lists valid provider entries while isolating malformed configuration', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const kv = {
			get: vi
				.fn()
				.mockResolvedValueOnce('{"id":"github","clientId":"id"}')
				.mockResolvedValueOnce('{')
		};
		const data = await (
			await listAuthKeys({ locals: owner, platform: { env: { KV: kv } } } as any)
		).json();
		expect(data.keys).toHaveLength(1);
		expect(data.keys[0]).toMatchObject({ name: 'GitHub OAuth', isSetupKey: true });
	});

	it('fails closed without KV and on unexpected reads', async () => {
		await expect(listAuthKeys({ locals: owner } as any)).rejects.toMatchObject({ status: 500 });
		await expect(
			listAuthKeys({
				locals: owner,
				platform: { env: { KV: { get: vi.fn().mockRejectedValue(new Error('KV')) } } }
			} as any)
		).resolves.toBeInstanceOf(Response);
	});

	it('validates and stores new provider keys', async () => {
		await expect(
			createAuthKey({
				locals: owner,
				platform: { env: { KV: {} } },
				request: { json: async () => ({}) }
			} as any)
		).rejects.toMatchObject({ status: 400 });
		await expect(
			createAuthKey({
				locals: owner,
				platform: { env: { KV: {} } },
				request: {
					json: async () => ({
						name: 'X',
						provider: 'google',
						clientId: 'id',
						clientSecret: 'secret'
					})
				}
			} as any)
		).rejects.toMatchObject({ status: 400 });
		const put = vi.fn();
		const response = await createAuthKey({
			locals: owner,
			platform: { env: { KV: { put } } },
			request: {
				json: async () => ({
					name: 'Discord',
					provider: 'discord',
					clientId: 'id',
					clientSecret: 'secret',
					type: 'oauth'
				})
			}
		} as any);
		expect(response.status).toBe(200);
		expect(put).toHaveBeenCalled();
	});

	it('maps malformed request bodies to a generic create failure', async () => {
		await expect(
			createAuthKey({
				locals: owner,
				platform: { env: { KV: {} } },
				request: { json: vi.fn().mockRejectedValue(new Error('parse')) }
			} as any)
		).rejects.toMatchObject({ status: 500 });
	});
});

describe('reorder and reset security edges', () => {
	it.each([
		[{}, 401],
		[{ user: { isAdmin: false, isOwner: false } }, 403]
	])('rejects unauthorized reorder requests', async (locals, status) => {
		await expect(reorder({ locals } as any)).rejects.toMatchObject({ status });
	});

	it('validates reorder bindings, type, body, and ownership', async () => {
		const admin = { user: { isAdmin: true } };
		await expect(reorder({ locals: admin } as any)).rejects.toMatchObject({ status: 500 });
		const statement = { bind: vi.fn(), first: vi.fn().mockResolvedValue(null) };
		statement.bind.mockReturnValue(statement);
		const DB = { prepare: vi.fn().mockReturnValue(statement) };
		await expect(
			reorder({ locals: admin, platform: { env: { DB } }, params: { type: 'missing' } } as any)
		).rejects.toMatchObject({ status: 404 });
	});

	it('validates filtered IDs and rejected and successful reorder operations', async () => {
		const contentType = {
			id: 'type',
			slug: 'guides',
			name: 'Guides',
			fields: '[]',
			settings: '{}',
			purpose: 'guide_section',
			visibility: 'public',
			submission_policy: 'admin_only'
		};
		const event = (results: unknown[], body: unknown) => {
			const statement = { bind: vi.fn(), first: vi.fn() };
			statement.bind.mockReturnValue(statement);
			statement.first.mockImplementation(() => Promise.resolve(results.shift() ?? null));
			return {
				locals: { user: { isAdmin: true } },
				platform: { env: { DB: { prepare: vi.fn().mockReturnValue(statement), batch: vi.fn() } } },
				params: { type: 'guides' },
				request: { json: async () => body }
			} as any;
		};
		await expect(reorder(event([contentType], { itemIds: [null, ''] }))).rejects.toMatchObject({
			status: 400
		});
		await expect(
			reorder(event([contentType, { count: 0 }], { itemIds: ['item'] }))
		).rejects.toMatchObject({ status: 400 });
		expect((await reorder(event([contentType, { count: 1 }], { itemIds: ['item'] }))).status).toBe(
			200
		);
	});

	it('requires owner reset dependencies and honors disabled reset', async () => {
		await expect(reset({ locals: owner } as any)).rejects.toMatchObject({ status: 500 });
		await expect(
			reset({ locals: owner, platform: { env: { KV: { get: vi.fn() } } } } as any)
		).rejects.toMatchObject({ status: 500 });
		await expect(
			reset({
				locals: owner,
				platform: { env: { KV: { get: vi.fn().mockResolvedValue('true') }, DB: {} } }
			} as any)
		).rejects.toMatchObject({ status: 403 });
	});

	it('hides unexpected reset storage failures', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		await expect(
			reset({
				locals: owner,
				platform: { env: { KV: { get: vi.fn().mockRejectedValue(new Error('storage')) }, DB: {} } }
			} as any)
		).rejects.toMatchObject({ status: 500 });
	});

	it('protects and redirects the reset page', async () => {
		await expect(resetPage({ locals: {} } as any)).rejects.toMatchObject({ status: 401 });
		await expect(resetPage({ locals: { user: { isOwner: false } } } as any)).rejects.toMatchObject({
			status: 403
		});
		await expect(
			resetPage({
				locals: owner,
				platform: { env: { KV: { get: vi.fn().mockResolvedValue('true') } } }
			} as any)
		).rejects.toMatchObject({ status: 302, location: '/' });
		expect(await resetPage({ locals: owner } as any)).toEqual({});
	});
});

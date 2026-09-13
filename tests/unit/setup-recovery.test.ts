import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../src/routes/api/setup/+server';
import { readSetupState } from '$lib/server/setup-state';

function kvWith(values: Partial<Record<string, string>>) {
	return {
		get: vi.fn(async (key: string) => values[key] ?? null),
		put: vi.fn(async (_key: string, _value: string) => {})
	};
}

const COMPLETE = {
	'auth_config:github': '{}',
	github_owner_id: '123',
	github_owner_username: 'owner'
};

describe('setup state', () => {
	it('is incomplete while any part of the owner configuration is missing', async () => {
		for (const partial of [
			{ 'auth_config:github': '{}' },
			{ github_owner_id: '123' },
			{ 'auth_config:github': '{}', github_owner_id: '123' },
			{ 'auth_config:github': '{}', github_owner_username: 'owner' }
		]) {
			expect((await readSetupState(kvWith(partial))).complete).toBe(false);
		}
	});

	it('is complete once configuration and owner are both stored', async () => {
		expect((await readSetupState(kvWith(COMPLETE))).complete).toBe(true);
	});

	it('is complete as soon as an admin has logged in, whatever else is stored', async () => {
		const state = await readSetupState(kvWith({ admin_first_login_completed: 'true' }));
		expect(state).toMatchObject({ locked: true, complete: true });
	});
});

describe('setup page access', () => {
	let load: (event: any) => Promise<unknown>;

	beforeEach(async () => {
		vi.resetModules();
		load = (await import('../../src/routes/setup/+page.server')).load as any;
	});

	it('stays open when a half-written installation needs repair', async () => {
		const result = await load({
			platform: { env: { KV: kvWith({ 'auth_config:github': '{}' }) } },
			locals: {}
		});
		expect(result).toEqual({});
	});

	it('closes once the owner configuration is complete', async () => {
		await expect(
			load({ platform: { env: { KV: kvWith(COMPLETE) } }, locals: {} })
		).rejects.toMatchObject({ status: 302, location: '/' });
	});
});

describe('setup repair', () => {
	function request(body: Record<string, unknown>) {
		return new Request('http://localhost/api/setup', {
			method: 'POST',
			headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
	}

	const payload = {
		clientId: 'client',
		clientSecret: 'client-secret',
		adminGithubUsername: 'owner'
	};

	beforeEach(() => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify({ id: 4815, login: 'owner' }), { status: 200 })
		);
	});

	it('lets the setup secret finish a half-written installation', async () => {
		const kv = kvWith({ 'auth_config:github': '{}' });
		const response = await POST({
			locals: {},
			request: request(payload),
			platform: { env: { SETUP_SECRET: 'secret', KV: kv } }
		} as any);

		expect(response.status).toBe(200);
		expect(kv.put).toHaveBeenCalledWith('github_owner_id', '4815');
		expect(kv.put).toHaveBeenCalledWith('github_owner_username', 'owner');
	});

	it('stores the owner before the OAuth config so a partial write stays repairable', async () => {
		const kv = kvWith({});
		await POST({
			locals: {},
			request: request(payload),
			platform: { env: { SETUP_SECRET: 'secret', KV: kv } }
		} as any);

		const keys = kv.put.mock.calls.map((call) => call[0]);
		expect(keys.indexOf('auth_config:github')).toBe(keys.length - 1);
		expect(keys).toContain('github_owner_id');
		expect(keys).toContain('github_owner_username');
	});

	it('still refuses to overwrite a complete installation', async () => {
		await expect(
			POST({
				locals: {},
				request: request(payload),
				platform: { env: { SETUP_SECRET: 'secret', KV: kvWith(COMPLETE) } }
			} as any)
		).rejects.toMatchObject({ status: 401 });
	});

	it('still refuses once an admin has logged in', async () => {
		await expect(
			POST({
				locals: { user: { id: 'owner', isOwner: true } },
				request: request(payload),
				platform: {
					env: { SETUP_SECRET: 'secret', KV: kvWith({ admin_first_login_completed: 'true' }) }
				}
			} as any)
		).rejects.toMatchObject({ status: 403 });
	});
});

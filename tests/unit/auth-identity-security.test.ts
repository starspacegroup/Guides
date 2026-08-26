import { describe, expect, it, vi } from 'vitest';
import { resolveOwnerStatus } from '$lib/utils/auth-identity';
import { matchesOwnerUsername, resolveGitHubOwnerConfig } from '$lib/utils/owner-config';

function platform(env: Record<string, unknown>) {
	return { env } as any;
}

describe('owner identity resolution', () => {
	it('normalizes configured IDs and usernames', async () => {
		expect(matchesOwnerUsername('Owner', 'owner')).toBe(true);
		expect(matchesOwnerUsername(null, 'owner')).toBe(false);
		expect(await resolveGitHubOwnerConfig({ GITHUB_OWNER_ID: ' owner-name ' })).toEqual({
			ownerId: undefined,
			ownerUsername: 'owner-name'
		});
	});

	it('fills missing owner values from KV', async () => {
		const get = vi.fn((key: string) => Promise.resolve(key.endsWith('_id') ? '123' : 'Owner'));
		expect(await resolveGitHubOwnerConfig({ KV: { get } })).toEqual({
			ownerId: '123',
			ownerUsername: 'Owner'
		});
	});

	it('matches direct user IDs and usernames without querying account links', async () => {
		expect(
			await resolveOwnerStatus(platform({ GITHUB_OWNER_ID: '123' }), {
				id: '123',
				github_login: null
			})
		).toBe(true);
		expect(
			await resolveOwnerStatus(platform({ GITHUB_OWNER_USERNAME: 'Owner' }), {
				id: 'x',
				github_login: 'owner'
			})
		).toBe(true);
	});

	it('matches linked GitHub IDs and rejects missing configuration', async () => {
		const statement = {
			bind: vi.fn(),
			first: vi.fn().mockResolvedValue({ provider_account_id: '123' })
		};
		statement.bind.mockReturnValue(statement);
		expect(
			await resolveOwnerStatus(
				platform({ GITHUB_OWNER_ID: '123', DB: { prepare: vi.fn().mockReturnValue(statement) } }),
				{ id: 'user', github_login: null }
			)
		).toBe(true);
		expect(await resolveOwnerStatus(platform({}), { id: 'user', github_login: null })).toBe(false);
	});
});

describe('owner identity resolution with a configured owner ID', () => {
	function linkedTo(providerAccountId: string | null) {
		const statement = {
			bind: vi.fn(),
			first: vi.fn().mockResolvedValue(providerAccountId ? { providerAccountId } : null)
		};
		statement.first.mockResolvedValue(
			providerAccountId ? { provider_account_id: providerAccountId } : null
		);
		statement.bind.mockReturnValue(statement);
		return { prepare: vi.fn().mockReturnValue(statement) };
	}

	it('refuses owner access to a username match when an owner ID is configured', async () => {
		const env = {
			GITHUB_OWNER_ID: '123',
			GITHUB_OWNER_USERNAME: 'Owner',
			DB: linkedTo(null)
		};
		expect(await resolveOwnerStatus(platform(env), { id: 'impostor', github_login: 'owner' })).toBe(
			false
		);
	});

	it('refuses owner access to a username match linked to a different GitHub account', async () => {
		const env = {
			GITHUB_OWNER_ID: '123',
			GITHUB_OWNER_USERNAME: 'Owner',
			DB: linkedTo('999')
		};
		expect(await resolveOwnerStatus(platform(env), { id: 'impostor', github_login: 'Owner' })).toBe(
			false
		);
	});

	it('refuses owner access when the account link cannot be read', async () => {
		expect(
			await resolveOwnerStatus(platform({ GITHUB_OWNER_ID: '123' }), {
				id: 'someone',
				github_login: 'Owner'
			})
		).toBe(false);
	});

	it('still grants owner access through the stable ID and the linked GitHub account', async () => {
		expect(
			await resolveOwnerStatus(platform({ GITHUB_OWNER_ID: '123', DB: linkedTo(null) }), {
				id: '123',
				github_login: null
			})
		).toBe(true);
		expect(
			await resolveOwnerStatus(platform({ GITHUB_OWNER_ID: '123', DB: linkedTo('123') }), {
				id: 'user',
				github_login: null
			})
		).toBe(true);
	});
});

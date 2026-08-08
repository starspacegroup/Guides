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

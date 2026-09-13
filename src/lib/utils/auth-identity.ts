import { resolveGitHubOwnerConfig, matchesOwnerUsername } from './owner-config';

export interface AuthIdentityRecord {
	id: string;
	email: string;
	name: string | null;
	github_login: string | null;
	github_avatar_url: string | null;
	is_admin: number;
}

export async function resolveOwnerStatus(
	platform: App.Platform | undefined,
	user: Pick<AuthIdentityRecord, 'id' | 'github_login'>
): Promise<boolean> {
	const config = await resolveGitHubOwnerConfig(platform?.env);
	// github_login is mutable and an admin can set it on any row, so it only decides ownership
	// while no stable owner ID exists (first-run setup). Once one does, it is the only authority.
	if (!config.ownerId) return matchesOwnerUsername(user.github_login, config.ownerUsername);
	if (user.id === config.ownerId) return true;
	if (!platform?.env.DB) return false;
	const link = await platform.env.DB.prepare(
		'SELECT provider_account_id FROM oauth_accounts WHERE user_id = ? AND provider = ?'
	)
		.bind(user.id, 'github')
		.first<{ provider_account_id: string }>();
	return link?.provider_account_id === config.ownerId;
}

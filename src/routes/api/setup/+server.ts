import { requireOwner } from '$lib/server/auth-guards';
import { readSetupState } from '$lib/server/setup-state';
import { error, isHttpError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const kv = platform?.env.KV;
		if (!kv) throw error(500, 'KV storage not available');
		const [config, owner, locked] = await Promise.all([
			kv.get('auth_config:github'),
			kv.get('github_owner_id'),
			kv.get('admin_first_login_completed')
		]);
		return json({ hasConfig: !!config, hasAdmin: !!owner, setupLocked: !!locked });
	} catch (err) {
		if (isHttpError(err)) throw err;
		throw error(500, 'Failed to check setup status');
	}
};

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	try {
		const kv = platform?.env.KV;
		if (!kv) throw error(500, 'KV storage not available');
		// Lock on a finished installation only. A partial write leaves nobody able to log in, so
		// locking on any single key would strand it: no owner exists to satisfy requireOwner, and
		// the setup secret would be refused. Incomplete state stays repairable by the secret holder.
		const { complete } = await readSetupState(kv);
		if (complete) {
			requireOwner(locals);
			throw error(403, 'Setup is locked. Use the owner-only reset endpoint first.');
		}
		const setupSecret = platform.env.SETUP_SECRET;
		if (!setupSecret) throw error(503, 'SETUP_SECRET is not configured');
		if (request.headers.get('authorization') !== `Bearer ${setupSecret}`)
			throw error(401, 'Invalid setup credentials');
		const data = await request.json();
		if (!data.clientId || !data.clientSecret)
			throw error(400, 'Client ID and Client Secret are required');
		if (data.provider && data.provider !== 'github')
			throw error(400, 'Initial setup only supports GitHub');
		const username = data.adminGithubUsername?.trim();
		if (!username) throw error(400, 'Admin GitHub Username is required');
		if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username))
			throw error(400, 'Invalid GitHub username format');
		const response = await fetch(`https://api.github.com/users/${username}`, {
			headers: {
				Accept: 'application/vnd.github.v3+json',
				'User-Agent': 'Guides'
			}
		});
		if (!response.ok)
			throw error(
				response.status === 404 ? 404 : 502,
				response.status === 404
					? `GitHub user '${username}' not found`
					: 'Failed to fetch GitHub user information'
			);
		const githubUser = await response.json();
		const now = new Date().toISOString();
		// Owner first, OAuth config last. These three writes are not atomic, and this order means a
		// failure part way through leaves an installation that cannot authenticate anyone rather
		// than one that can authenticate everyone as nobody.
		await kv.put('github_owner_id', String(githubUser.id));
		await kv.put('github_owner_username', String(githubUser.login));
		await kv.put(
			'auth_config:github',
			JSON.stringify({
				id: crypto.randomUUID(),
				provider: 'github',
				clientId: data.clientId,
				clientSecret: data.clientSecret,
				createdAt: now,
				updatedAt: now
			})
		);
		return json({
			success: true,
			message: `Configuration saved! Admin user set to @${githubUser.login}.`,
			adminUsername: String(githubUser.login),
			adminId: String(githubUser.id)
		});
	} catch (err) {
		if (isHttpError(err)) throw err;
		throw error(500, 'Failed to save configuration');
	}
};

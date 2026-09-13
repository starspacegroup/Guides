import { createSession, deleteSession } from '$lib/utils/db';
import { resolveOwnerStatus, type AuthIdentityRecord } from '$lib/utils/auth-identity';
import type { OAuthProvider } from '$lib/utils/oauth-state';
import { buildDatabaseSessionCookieHeader } from '$lib/utils/session';
import type { D1Database } from '@cloudflare/workers-types';

export async function finalizeOAuthLogin(options: {
	db: D1Database;
	platform: App.Platform;
	url: URL;
	userId: string;
	currentSessionToken?: string;
	linkedProvider?: OAuthProvider;
}): Promise<Response> {
	const user = await options.db
		.prepare(
			'SELECT id, email, name, github_login, github_avatar_url, is_admin FROM users WHERE id = ?'
		)
		.bind(options.userId)
		.first<AuthIdentityRecord>();
	if (!user) throw new Error('OAuth user missing');
	const isOwner = await resolveOwnerStatus(options.platform, user);
	const session = await createSession(options.db, user.id, 7);
	if (options.currentSessionToken) await deleteSession(options.db, options.currentSessionToken);
	if (isOwner) await options.platform.env.KV.put('admin_first_login_completed', 'true');
	const destination = options.linkedProvider
		? `/profile?linked=${options.linkedProvider}`
		: isOwner || user.is_admin === 1
			? '/admin'
			: '/';
	return new Response(null, {
		status: 302,
		headers: {
			Location: new URL(destination, options.url.origin).toString(),
			'Set-Cookie': await buildDatabaseSessionCookieHeader(
				session.token,
				options.url,
				options.platform.env.SESSION_SECRET
			)
		}
	});
}

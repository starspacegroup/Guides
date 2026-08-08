import { resolveOwnerStatus } from '$lib/utils/auth-identity';
import { findValidSession } from '$lib/utils/db';
import { decodeDatabaseSessionCookie } from '$lib/utils/session';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

export const authHandler: Handle = async ({ event, resolve }) => {
	const cookie = event.cookies.get('session');
	if (cookie) {
		try {
			const db = event.platform?.env.DB;
			if (!db) throw new Error('Session database unavailable');
			const token = await decodeDatabaseSessionCookie(cookie, event.platform?.env.SESSION_SECRET);
			if (!token) throw new Error('Invalid session cookie');
			const session = await findValidSession(db, token);
			if (!session) throw new Error('Expired or revoked session');
			const user = await db
				.prepare(
					`SELECT id, email, name, github_login, github_avatar_url, is_admin
				 FROM users WHERE id = ?`
				)
				.bind(session.user_id)
				.first<{
					id: string;
					email: string;
					name: string | null;
					github_login: string | null;
					github_avatar_url: string | null;
					is_admin: number;
				}>();
			if (!user) throw new Error('Session user missing');
			const isOwner = await resolveOwnerStatus(event.platform, user);
			event.locals.user = {
				id: user.id,
				login: user.github_login || user.email.split('@')[0] || user.email,
				email: user.email,
				name: user.name || undefined,
				avatarUrl: user.github_avatar_url || undefined,
				isOwner,
				isAdmin: user.is_admin === 1 || isOwner
			};
		} catch {
			delete event.locals.user;
			event.cookies.delete('session', { path: '/' });
		}
	}
	return resolve(event);
};

export const handle = sequence(authHandler);

import { error, isHttpError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	isPiiRevealed,
	maskEmail,
	maskGeneric,
	maskName,
	PII_REVEAL_COOKIE
} from '$lib/server/pii-mask';
import { requireAdmin } from '$lib/server/auth-guards';

interface UserRow {
	id: string;
	email: string;
	name: string | null;
	is_admin: number;
	github_login: string | null;
	github_avatar_url: string | null;
	created_at: string;
	github_id: string | null;
}

export const GET: RequestHandler = async ({ platform, locals, cookies }) => {
	const user = requireAdmin(locals);

	try {
		const db = platform?.env?.DB;
		if (!db) {
			throw error(500, 'Database not available');
		}

		// Get all users with their OAuth info
		const result = await db
			.prepare(
				`
			SELECT 
				u.id,
				u.email,
				u.name,
				u.is_admin,
				u.github_login,
				u.github_avatar_url,
				u.created_at,
				oa.provider_account_id as github_id
			FROM users u
			LEFT JOIN oauth_accounts oa ON u.id = oa.user_id AND oa.provider = 'github'
			ORDER BY u.created_at DESC
		`
			)
			.all<UserRow>();

		const revealed = isPiiRevealed(user, cookies.get(PII_REVEAL_COOKIE));
		const users = (result.results || []).map((entry) =>
			revealed
				? entry
				: {
						// id is the handle PATCH and DELETE act on; masking it breaks user management.
						...entry,
						email: maskEmail(entry.email),
						name: maskName(entry.name),
						github_login: maskGeneric(entry.github_login),
						github_avatar_url: null,
						github_id: maskGeneric(entry.github_id)
					}
		);
		return json({ users });
	} catch (err) {
		if (isHttpError(err)) throw err;
		console.error('Failed to fetch users:', err);
		throw error(500, 'Failed to fetch users');
	}
};

export const POST: RequestHandler = async ({ platform, locals, request }) => {
	requireAdmin(locals);

	try {
		const db = platform?.env?.DB;
		if (!db) {
			throw error(500, 'Database not available');
		}

		const body = await request.json();
		const { githubLogin, email } = body;

		if (!githubLogin || !email) {
			throw error(400, 'GitHub login and email are required');
		}

		// Create a placeholder user that will be completed on first login
		const userId = crypto.randomUUID();
		await db
			.prepare(
				`
			INSERT INTO users (id, email, github_login, is_admin, created_at)
			VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
		`
			)
			.bind(userId, email, githubLogin)
			.run();

		return json({
			success: true,
			message: 'User invited successfully',
			user: {
				id: userId,
				email,
				github_login: githubLogin,
				is_admin: 0
			}
		});
	} catch (err) {
		if (isHttpError(err)) throw err;
		console.error('Failed to invite user:', err);
		if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
			throw error(400, 'User with this email or GitHub login already exists');
		}
		throw error(500, 'Failed to invite user');
	}
};

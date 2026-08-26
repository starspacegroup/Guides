import { mergeAccounts } from '$lib/services/account-merge';
import type { OAuthProvider } from '$lib/utils/oauth-state';
import type { D1Database } from '@cloudflare/workers-types';

interface Options {
	db: D1Database;
	provider: OAuthProvider;
	providerAccountId: string;
	legacyUserId: string;
	email?: string | null;
	linkingUserId?: string;
	createUser(id: string): Promise<void>;
	updateUser(id: string, match: 'link' | 'email' | 'legacy'): Promise<void>;
}

async function ensureAccount(
	db: D1Database,
	userId: string,
	provider: OAuthProvider,
	providerId: string
) {
	const existing = await db
		.prepare('SELECT id FROM oauth_accounts WHERE user_id = ? AND provider = ?')
		.bind(userId, provider)
		.first();
	if (!existing)
		await db
			.prepare(
				'INSERT INTO oauth_accounts (id, user_id, provider, provider_account_id, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
			)
			.bind(crypto.randomUUID(), userId, provider, providerId)
			.run();
}

export async function reconcileOAuthAccount(
	options: Options
): Promise<{ userId: string; linkedProvider?: OAuthProvider }> {
	const { db, provider, providerAccountId, legacyUserId, email, linkingUserId } = options;
	const linked = await db
		.prepare('SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_account_id = ?')
		.bind(provider, providerAccountId)
		.first<{ user_id: string }>();
	if (linkingUserId) {
		if (linked && linked.user_id !== linkingUserId)
			await mergeAccounts(db, linked.user_id, linkingUserId);
		else if (!linked) await ensureAccount(db, linkingUserId, provider, providerAccountId);
		await options.updateUser(linkingUserId, 'link');
		return { userId: linkingUserId, linkedProvider: provider };
	}
	if (linked) return { userId: linked.user_id };
	const normalizedEmail = email?.trim().toLowerCase();
	const matched = normalizedEmail
		? await db
				.prepare('SELECT id FROM users WHERE lower(email) = lower(?)')
				.bind(normalizedEmail)
				.first<{ id: string }>()
		: null;
	const legacy = await db
		.prepare('SELECT id FROM users WHERE id = ?')
		.bind(legacyUserId)
		.first<{ id: string }>();
	if (matched) {
		if (legacy && legacy.id !== matched.id) await mergeAccounts(db, legacy.id, matched.id);
		await ensureAccount(db, matched.id, provider, providerAccountId);
		await options.updateUser(matched.id, 'email');
		return { userId: matched.id };
	}
	if (legacy) {
		await ensureAccount(db, legacy.id, provider, providerAccountId);
		await options.updateUser(legacy.id, 'legacy');
		return { userId: legacy.id };
	}
	await options.createUser(legacyUserId);
	await ensureAccount(db, legacyUserId, provider, providerAccountId);
	return { userId: legacyUserId };
}

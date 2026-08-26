import { reconcileOAuthAccount } from '$lib/server/oauth-account';
import { finalizeOAuthLogin } from '$lib/server/oauth-finalization';
import { resolveOwnerStatus } from '$lib/utils/auth-identity';
import { getAuthProviderCredentials } from '$lib/utils/auth-provider-config';
import {
	consumeOAuthTransaction,
	createOAuthTransaction,
	oauthStateCookieOptions,
	type OAuthProvider,
	verifyOAuthTransaction
} from '$lib/utils/oauth-state';
import { decodeDatabaseSessionCookie } from '$lib/utils/session';
import type { D1Database } from '@cloudflare/workers-types';
import { isRedirect, redirect, type RequestHandler } from '@sveltejs/kit';

type RouteEvent = Parameters<RequestHandler>[0];
type AccountMatch = 'link' | 'email' | 'legacy';

interface OAuthIdentity {
	providerAccountId: string;
	legacyUserId: string;
	email: string | null;
	createUser(db: D1Database, platform: App.Platform, id: string): Promise<void>;
	updateUser(db: D1Database, id: string, match: AccountMatch): Promise<void>;
}

function record(value: unknown): Record<string, unknown> {
	if (typeof value !== 'object' || value === null) throw new Error('Invalid OAuth response');
	return value as Record<string, unknown>;
}

function requiredString(value: unknown): string {
	if ((typeof value !== 'string' && typeof value !== 'number') || String(value).length === 0) {
		throw new Error('Invalid OAuth profile');
	}
	return String(value);
}

function optionalString(value: unknown): string | null {
	return typeof value === 'string' && value ? value : null;
}

function authorizationUrl(
	provider: OAuthProvider,
	origin: string,
	clientId: string,
	state: string
) {
	const callback = `${origin}/api/auth/${provider}/callback`;
	const params = new URLSearchParams({ client_id: clientId, redirect_uri: callback, state });
	if (provider === 'github') {
		params.set('scope', 'read:user user:email');
		return `https://github.com/login/oauth/authorize?${params}`;
	}
	params.set('response_type', 'code');
	params.set('scope', 'identify email');
	return `https://discord.com/api/oauth2/authorize?${params}`;
}

async function exchangeCode(
	provider: OAuthProvider,
	url: URL,
	code: string,
	clientId: string,
	clientSecret: string
): Promise<string> {
	const callback = `${url.origin}/api/auth/${provider}/callback`;
	const response = await fetch(
		provider === 'github'
			? 'https://github.com/login/oauth/access_token'
			: 'https://discord.com/api/oauth2/token',
		provider === 'github'
			? {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
					body: JSON.stringify({
						client_id: clientId,
						client_secret: clientSecret,
						code,
						redirect_uri: callback
					})
				}
			: {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
						client_id: clientId,
						client_secret: clientSecret,
						code,
						grant_type: 'authorization_code',
						redirect_uri: callback
					})
				}
	);
	if (!response.ok) throw redirect(302, '/auth/login?error=token_exchange_failed');
	const token = optionalString(record(await response.json()).access_token);
	if (!token) throw redirect(302, '/auth/login?error=no_access_token');
	return token;
}

async function fetchIdentity(provider: OAuthProvider, accessToken: string): Promise<OAuthIdentity> {
	const response = await fetch(
		provider === 'github' ? 'https://api.github.com/user' : 'https://discord.com/api/users/@me',
		{
			headers:
				provider === 'github'
					? {
							Authorization: `Bearer ${accessToken}`,
							Accept: 'application/vnd.github.v3+json',
							'User-Agent': 'Guides'
						}
					: { Authorization: `Bearer ${accessToken}` }
		}
	);
	if (!response.ok) throw redirect(302, '/auth/login?error=user_fetch_failed');
	const profile = record(await response.json());
	const providerAccountId = requiredString(profile.id);
	if (provider === 'github') {
		// GitHub only publishes an address on /user that the account has already verified,
		// so the profile email is safe to match an existing user against.
		const email = optionalString(profile.email);
		const login = requiredString(profile.login);
		const name = optionalString(profile.name);
		const avatar = optionalString(profile.avatar_url);
		return {
			providerAccountId,
			legacyUserId: providerAccountId,
			email,
			async createUser(db, platform, id) {
				const isOwner = await resolveOwnerStatus(platform, { id, github_login: login });
				await db
					.prepare(
						`INSERT INTO users (id, email, name, github_login, github_avatar_url, is_admin, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
					)
					.bind(id, email || `${login}@github.local`, name, login, avatar, isOwner ? 1 : 0)
					.run();
			},
			async updateUser(db, id) {
				await db
					.prepare(
						`UPDATE users SET name = ?, github_login = ?, github_avatar_url = ?,
					 updated_at = CURRENT_TIMESTAMP WHERE id = ?`
					)
					.bind(name, login, avatar, id)
					.run();
			}
		};
	}
	// Discord hands back an address before the account confirms it. An unverified address must
	// never select an existing user, and must never be stored where a later login could match it.
	const email = profile.verified === true ? optionalString(profile.email) : null;
	const username = requiredString(profile.username);
	const name = optionalString(profile.global_name) || username;
	return {
		providerAccountId,
		legacyUserId: `discord_${providerAccountId}`,
		email,
		async createUser(db, _platform, id) {
			await db
				.prepare(
					'INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
				)
				.bind(id, email || `${username}@discord.local`, name)
				.run();
		},
		async updateUser(db, id, match) {
			if (match === 'legacy') {
				await db
					.prepare('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
					.bind(name, id)
					.run();
			}
		}
	};
}

export async function startOAuth(provider: OAuthProvider, event: RouteEvent): Promise<never> {
	const { platform, url, cookies, locals } = event;
	let clientId: string | undefined;
	try {
		({ clientId } = await getAuthProviderCredentials(platform, provider));
	} catch {
		throw redirect(302, '/setup?error=oauth_not_configured');
	}
	if (!clientId) throw redirect(302, '/setup?error=oauth_not_configured');
	if (!platform?.env.DB) throw redirect(302, '/auth/login?error=oauth_failed');
	const sessionToken = await decodeDatabaseSessionCookie(
		cookies.get('session'),
		platform.env.SESSION_SECRET
	);
	const intent = locals.user ? 'link' : 'login';
	const issued = await createOAuthTransaction(
		platform.env.DB,
		provider,
		intent,
		locals.user?.id,
		sessionToken || undefined,
		platform.env.SESSION_SECRET
	);
	cookies.set(`oauth_state_${provider}`, issued.cookie, oauthStateCookieOptions(provider, url));
	throw redirect(302, authorizationUrl(provider, url.origin, clientId, issued.state));
}

export async function completeOAuth(provider: OAuthProvider, event: RouteEvent): Promise<Response> {
	const { url, cookies, platform, locals } = event;
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	if (!code) throw redirect(302, '/auth/login?error=no_code');
	if (!platform?.env.DB) throw redirect(302, '/auth/login?error=oauth_failed');
	const db = platform.env.DB;
	const currentToken = await decodeDatabaseSessionCookie(
		cookies.get('session'),
		platform.env.SESSION_SECRET
	);
	const pending = await verifyOAuthTransaction(
		db,
		provider,
		state,
		cookies,
		platform.env.SESSION_SECRET,
		currentToken || undefined
	);
	if (!pending || (pending.intent === 'link' && locals.user?.id !== pending.userId)) {
		throw redirect(302, '/auth/login?error=invalid_state');
	}
	try {
		const { clientId, clientSecret } = await getAuthProviderCredentials(platform, provider);
		if (!clientId || !clientSecret) throw redirect(302, '/auth/login?error=not_configured');
		const accessToken = await exchangeCode(provider, url, code, clientId, clientSecret);
		const transaction = await consumeOAuthTransaction(
			db,
			provider,
			state,
			cookies,
			platform.env.SESSION_SECRET,
			currentToken || undefined
		);
		if (!transaction) throw redirect(302, '/auth/login?error=invalid_state');
		const identity = await fetchIdentity(provider, accessToken);
		const reconciled = await reconcileOAuthAccount({
			db,
			provider,
			providerAccountId: identity.providerAccountId,
			legacyUserId: identity.legacyUserId,
			email: identity.email,
			linkingUserId: transaction.intent === 'link' ? locals.user?.id : undefined,
			createUser: (id) => identity.createUser(db, platform, id),
			updateUser: (id, match) => identity.updateUser(db, id, match)
		});
		return finalizeOAuthLogin({
			db,
			platform,
			url,
			userId: reconciled.userId,
			currentSessionToken: reconciled.linkedProvider ? currentToken || undefined : undefined,
			linkedProvider: reconciled.linkedProvider
		});
	} catch (error) {
		if (isRedirect(error)) throw error;
		console.error(`${provider === 'github' ? 'GitHub' : 'Discord'} OAuth callback error`);
		throw redirect(302, '/auth/login?error=oauth_failed');
	}
}

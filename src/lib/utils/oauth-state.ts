import type { D1Database } from '@cloudflare/workers-types';
import { hashSessionToken, signValue, verifySignedValue } from './session';

export type OAuthProvider = 'github' | 'discord';
export type OAuthIntent = 'login' | 'link';
interface OAuthStateBase {
	provider: OAuthProvider;
	state: string;
	issuedAt: number;
}
export type OAuthStatePayload =
	| (OAuthStateBase & { intent: 'login' })
	| (OAuthStateBase & { intent: 'link'; userId: string });

const MAX_AGE = 10 * 60;
const cookieName = (provider: OAuthProvider) => `oauth_state_${provider}`;
const cookiePath = (provider: OAuthProvider) => `/api/auth/${provider}/callback`;

function opaqueState(): string {
	let binary = '';
	for (const byte of crypto.getRandomValues(new Uint8Array(32)))
		binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function verifyOAuthState(
	provider: OAuthProvider,
	state: string | null | undefined,
	cookie: string | null | undefined,
	secret?: string | null
): Promise<OAuthStatePayload | null> {
	if (!state) return null;
	const payload = await verifySignedValue<OAuthStatePayload>(cookie, secret);
	if (
		!payload ||
		payload.provider !== provider ||
		payload.state !== state ||
		!['login', 'link'].includes(payload.intent) ||
		typeof payload.issuedAt !== 'number' ||
		Date.now() - payload.issuedAt > MAX_AGE * 1000 ||
		payload.issuedAt > Date.now() + 60_000 ||
		(payload.intent === 'link' && !payload.userId)
	)
		return null;
	return payload;
}

export async function createOAuthTransaction(
	db: D1Database,
	provider: OAuthProvider,
	intent: OAuthIntent,
	userId: string | undefined,
	sessionToken: string | undefined,
	secret?: string | null
) {
	const state = opaqueState();
	let payload: OAuthStatePayload;
	let transactionUserId: string | null = null;
	let sessionId: string | null = null;
	if (intent === 'link') {
		if (!userId || !sessionToken) throw new Error('Linking requires an authenticated session');
		payload = { provider, state, intent, userId, issuedAt: Date.now() };
		transactionUserId = userId;
		sessionId = await hashSessionToken(sessionToken);
	} else {
		payload = { provider, state, intent, issuedAt: Date.now() };
	}
	const cookie = await signValue(payload, secret);
	// Consumed and expired rows are dead weight: consume already rejects them, and nothing else
	// deletes them, so without this they accumulate for the lifetime of the installation. Best
	// effort — a failed sweep must never stop someone logging in. No bound parameters, so this
	// leaves the insert below as the first statement carrying user data.
	try {
		await db
			.prepare(
				`DELETE FROM oauth_transactions
			WHERE consumed_at IS NOT NULL OR datetime(expires_at) <= CURRENT_TIMESTAMP`
			)
			.run();
	} catch {
		console.error('Failed to prune spent OAuth transactions');
	}
	await db
		.prepare(
			`INSERT INTO oauth_transactions (id, provider, intent, user_id, session_id, expires_at)
		VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(
			await hashSessionToken(state),
			provider,
			intent,
			transactionUserId,
			sessionId,
			new Date(Date.now() + MAX_AGE * 1000).toISOString()
		)
		.run();
	return { state, cookie };
}

interface Cookies {
	get(name: string): string | undefined;
	delete(name: string, options: { path: string }): void;
}

async function transaction(
	db: D1Database,
	provider: OAuthProvider,
	state: string | null | undefined,
	cookies: Cookies,
	secret?: string | null,
	sessionToken?: string,
	consume = false
): Promise<OAuthStatePayload | null> {
	const payload = await verifyOAuthState(
		provider,
		state,
		cookies.get(cookieName(provider)),
		secret
	);
	if (!payload) return null;
	const query = consume
		? `UPDATE oauth_transactions SET consumed_at = CURRENT_TIMESTAMP WHERE id = ? AND provider = ?
		   AND consumed_at IS NULL AND datetime(expires_at) > CURRENT_TIMESTAMP RETURNING intent, user_id, session_id`
		: `SELECT intent, user_id, session_id FROM oauth_transactions WHERE id = ? AND provider = ?
		   AND consumed_at IS NULL AND datetime(expires_at) > CURRENT_TIMESTAMP`;
	const stored = await db
		.prepare(query)
		.bind(await hashSessionToken(payload.state), provider)
		.first<{ intent: OAuthIntent; user_id: string | null; session_id: string | null }>();
	if (consume) cookies.delete(cookieName(provider), { path: cookiePath(provider) });
	if (!stored || stored.intent !== payload.intent) return null;
	if (payload.intent === 'login') return !stored.user_id && !stored.session_id ? payload : null;
	if (!payload.userId || !sessionToken) return null;
	return stored.user_id === payload.userId &&
		stored.session_id === (await hashSessionToken(sessionToken))
		? payload
		: null;
}

export const verifyOAuthTransaction = (
	db: D1Database,
	provider: OAuthProvider,
	state: string | null | undefined,
	cookies: Cookies,
	secret?: string | null,
	session?: string
) => transaction(db, provider, state, cookies, secret, session);
export const consumeOAuthTransaction = (
	db: D1Database,
	provider: OAuthProvider,
	state: string | null | undefined,
	cookies: Cookies,
	secret?: string | null,
	session?: string
) => transaction(db, provider, state, cookies, secret, session, true);

export const oauthStateCookieOptions = (provider: OAuthProvider, url: URL) => ({
	path: cookiePath(provider),
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: url.protocol === 'https:',
	maxAge: MAX_AGE
});

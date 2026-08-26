const encoder = new TextEncoder();
const DEV_FALLBACK_SECRET = 'guides-dev-insecure-session-secret';

function resolveSecret(secret?: string | null): string | null {
	if (secret) return secret;
	return import.meta.env.DEV ? DEV_FALLBACK_SECRET : null;
}

function base64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function createSessionToken(): string {
	return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashSessionToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
	return base64Url(new Uint8Array(digest));
}

function decodeBase64Url(value: string): ArrayBuffer {
	let normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	while (normalized.length % 4) normalized += '=';
	return Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0))
		.buffer as ArrayBuffer;
}

async function signingKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	);
}

export async function signValue(value: unknown, secret?: string | null): Promise<string> {
	const resolved = resolveSecret(secret);
	if (!resolved) throw new Error('SESSION_SECRET is not configured');
	const payload = base64Url(encoder.encode(JSON.stringify(value)));
	const signature = await crypto.subtle.sign(
		'HMAC',
		await signingKey(resolved),
		encoder.encode(payload)
	);
	return `${payload}.${base64Url(new Uint8Array(signature))}`;
}

export async function verifySignedValue<T>(
	value?: string | null,
	secret?: string | null
): Promise<T | null> {
	const resolved = resolveSecret(secret);
	if (!value || !resolved) return null;
	const [payload, signature, extra] = value.split('.');
	if (!payload || !signature || extra) return null;
	try {
		const signatureBytes = decodeBase64Url(signature);
		if (base64Url(new Uint8Array(signatureBytes)) !== signature) return null;
		const valid = await crypto.subtle.verify(
			'HMAC',
			await signingKey(resolved),
			signatureBytes,
			encoder.encode(payload)
		);
		return valid ? (JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as T) : null;
	} catch {
		return null;
	}
}

export async function decodeDatabaseSessionCookie(
	cookie?: string,
	secret?: string | null
): Promise<string | null> {
	const value = await verifySignedValue<{ token: string }>(cookie, secret);
	return value && typeof value.token === 'string' && value.token ? value.token : null;
}

export async function buildDatabaseSessionCookieHeader(
	token: string,
	url: URL,
	secret?: string | null
): Promise<string> {
	if (!token) throw new Error('Refusing to issue an empty session token');
	const parts = [
		`session=${await signValue({ token }, secret)}`,
		'Path=/',
		'HttpOnly',
		'SameSite=Lax',
		`Max-Age=${60 * 60 * 24 * 7}`
	];
	if (url.protocol === 'https:') parts.push('Secure');
	return parts.join('; ');
}

import type { OAuthProvider } from './oauth-state';

export const AUTH_PROVIDERS = ['github', 'discord'] as const satisfies readonly OAuthProvider[];

export interface AuthProviderConfig {
	id: string;
	provider: OAuthProvider;
	clientId: string;
	clientSecret: string;
	createdAt: string;
	updatedAt: string;
	updatedBy?: string;
}

export interface AuthProviderSummary {
	id: string;
	clientId: string;
	createdAt: string;
}

export function isAuthProvider(value: unknown): value is OAuthProvider {
	return value === 'github' || value === 'discord';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function parseConfigRecord(value: string): Record<string, unknown> {
	const config: unknown = JSON.parse(value);
	if (!isRecord(config)) throw new TypeError('Invalid authentication provider configuration');
	return config;
}

export function parseAuthProviderConfig(value: string): AuthProviderConfig | null {
	const config = parseConfigRecord(value);
	if (
		typeof config.id !== 'string' ||
		!isAuthProvider(config.provider) ||
		typeof config.clientId !== 'string' ||
		typeof config.clientSecret !== 'string' ||
		typeof config.createdAt !== 'string' ||
		typeof config.updatedAt !== 'string'
	) {
		return null;
	}
	return {
		id: config.id,
		provider: config.provider,
		clientId: config.clientId,
		clientSecret: config.clientSecret,
		createdAt: config.createdAt,
		updatedAt: config.updatedAt,
		...(typeof config.updatedBy === 'string' ? { updatedBy: config.updatedBy } : {})
	};
}

export async function readAuthProviderSummary(
	kv: App.Platform['env']['KV'],
	provider: OAuthProvider
): Promise<AuthProviderSummary | null> {
	const stored = await kv.get(`auth_config:${provider}`);
	if (!stored) return null;
	const config = parseConfigRecord(stored);
	if (typeof config.id !== 'string' || typeof config.clientId !== 'string') return null;
	return {
		id: config.id,
		clientId: config.clientId,
		createdAt: typeof config.createdAt === 'string' ? config.createdAt : ''
	};
}

async function readAuthProviderCredentials(
	kv: App.Platform['env']['KV'],
	provider: OAuthProvider
): Promise<{ clientId: string | undefined; clientSecret: string | undefined }> {
	const stored = await kv.get(`auth_config:${provider}`);
	if (!stored) return { clientId: undefined, clientSecret: undefined };
	const config = parseConfigRecord(stored);
	return {
		clientId: typeof config.clientId === 'string' ? config.clientId : undefined,
		clientSecret: typeof config.clientSecret === 'string' ? config.clientSecret : undefined
	};
}

export async function readAuthProviderConfig(
	kv: App.Platform['env']['KV'],
	provider: OAuthProvider
): Promise<AuthProviderConfig | null> {
	const stored = await kv.get(`auth_config:${provider}`);
	return stored ? parseAuthProviderConfig(stored) : null;
}

export async function getAuthProviderCredentials(
	platform: App.Platform | undefined,
	provider: OAuthProvider
) {
	const credentials =
		provider === 'github'
			? {
					clientId: platform?.env.GITHUB_CLIENT_ID,
					clientSecret: platform?.env.GITHUB_CLIENT_SECRET
				}
			: {
					clientId: platform?.env.DISCORD_CLIENT_ID,
					clientSecret: platform?.env.DISCORD_CLIENT_SECRET
				};
	if ((!credentials.clientId || !credentials.clientSecret) && platform?.env.KV) {
		const stored = await readAuthProviderCredentials(platform.env.KV, provider);
		credentials.clientId ||= stored.clientId;
		credentials.clientSecret ||= stored.clientSecret;
	}
	return credentials;
}

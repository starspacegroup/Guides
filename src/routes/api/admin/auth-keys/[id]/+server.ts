import { error, json } from '@sveltejs/kit';
import { requireOwner } from '$lib/server/auth-guards';
import {
	AUTH_PROVIDERS,
	isAuthProvider,
	readAuthProviderConfig,
	type AuthProviderConfig
} from '$lib/utils/auth-provider-config';
import type { RequestHandler } from './$types';

type AuthConfigStore = App.Platform['env']['KV'];

async function protectSetupKey(kv: AuthConfigStore, id: string, action: string) {
	if ((await readAuthProviderConfig(kv, 'github'))?.id === id) {
		throw error(403, `Cannot ${action} setup authentication key`);
	}
}

export const PUT: RequestHandler = async ({ params, request, platform, locals }) => {
	const owner = requireOwner(locals);
	const data: unknown = await request.json();
	if (typeof data !== 'object' || data === null) throw error(400, 'Invalid request body');
	const input = data as Record<string, unknown>;
	if (!isAuthProvider(input.provider)) {
		throw error(400, 'Unsupported authentication provider');
	}
	if (typeof input.name !== 'string' || typeof input.clientId !== 'string') {
		throw error(400, 'Missing required fields');
	}

	const kv = platform?.env.KV;
	if (!kv) throw error(500, 'KV storage not available');
	await protectSetupKey(kv, params.id, 'edit');
	const updatedAt = new Date().toISOString();
	const existing = await readAuthProviderConfig(kv, input.provider);
	const clientSecret =
		typeof input.clientSecret === 'string' ? input.clientSecret : existing?.clientSecret;
	if (!clientSecret) throw error(400, 'Client Secret is required');
	const config: AuthProviderConfig = {
		id: params.id,
		provider: input.provider,
		clientId: input.clientId,
		clientSecret,
		createdAt: existing?.createdAt || updatedAt,
		updatedAt,
		updatedBy: owner.id
	};
	await kv.put(`auth_config:${input.provider}`, JSON.stringify(config));
	return json({
		success: true,
		key: {
			id: params.id,
			name: input.name,
			provider: input.provider,
			type: input.type,
			clientId: input.clientId,
			updatedBy: owner.id,
			updatedAt
		}
	});
};

export const DELETE: RequestHandler = async ({ params, platform, locals }) => {
	requireOwner(locals);
	const kv = platform?.env.KV;
	if (!kv) throw error(500, 'KV storage not available');
	await protectSetupKey(kv, params.id, 'delete');
	for (const provider of AUTH_PROVIDERS) {
		if ((await readAuthProviderConfig(kv, provider))?.id === params.id) {
			await kv.delete(`auth_config:${provider}`);
			break;
		}
	}
	return json({ success: true });
};

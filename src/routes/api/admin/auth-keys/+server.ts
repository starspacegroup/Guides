import { requireOwner } from '$lib/server/auth-guards';
import {
	AUTH_PROVIDERS,
	isAuthProvider,
	readAuthProviderSummary
} from '$lib/utils/auth-provider-config';
import { error, isHttpError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, locals }) => {
	requireOwner(locals);
	try {
		if (!platform?.env.KV) throw error(500, 'KV storage not available');
		const keys = [];
		for (const provider of AUTH_PROVIDERS) {
			try {
				const config = await readAuthProviderSummary(platform.env.KV, provider);
				if (!config) continue;
				keys.push({
					id: config.id,
					name: `${provider === 'github' ? 'GitHub' : 'Discord'} OAuth`,
					provider,
					type: 'oauth',
					clientId: config.clientId,
					createdAt: config.createdAt,
					isSetupKey: provider === 'github'
				});
			} catch (parseError) {
				console.error(
					`Failed to parse ${provider === 'github' ? 'GitHub' : 'Discord'} OAuth config:`,
					parseError
				);
			}
		}
		return json({ keys });
	} catch (err) {
		if (isHttpError(err)) throw err;
		throw error(500, 'Failed to fetch authentication keys');
	}
};

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	requireOwner(locals);
	try {
		if (!platform?.env.KV) throw error(500, 'KV storage not available');
		const data: unknown = await request.json();
		if (typeof data !== 'object' || data === null) throw error(400, 'Invalid request body');
		const input = data as Record<string, unknown>;
		if (
			typeof input.name !== 'string' ||
			!isAuthProvider(input.provider) ||
			typeof input.clientId !== 'string' ||
			typeof input.clientSecret !== 'string'
		)
			throw error(400, 'Missing required fields');
		const id = crypto.randomUUID();
		const createdAt = new Date().toISOString();
		await platform.env.KV.put(
			`auth_config:${input.provider}`,
			JSON.stringify({
				id,
				provider: input.provider,
				clientId: input.clientId,
				clientSecret: input.clientSecret,
				createdAt,
				updatedAt: createdAt
			})
		);
		return json({
			success: true,
			key: {
				id,
				name: input.name,
				provider: input.provider,
				type: input.type,
				clientId: input.clientId,
				createdAt
			}
		});
	} catch (err) {
		if (isHttpError(err)) throw err;
		throw error(500, 'Failed to create authentication key');
	}
};

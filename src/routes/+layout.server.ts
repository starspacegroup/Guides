import type { LayoutServerLoad } from './$types';
import { getPublicGuideCollections } from '$lib/services/cms';

export const load: LayoutServerLoad = async ({ locals, fetch, platform }) => {
	// Check if AI providers are enabled
	let hasAIProviders = false;
	let guideCollections = [];
	try {
		const response = await fetch('/api/admin/ai-keys/status');
		if (response.ok) {
			const data = await response.json();
			hasAIProviders = data.hasProviders || false;
		}
	} catch (error) {
		console.error('Failed to check AI provider status:', error);
	}

	const db = platform?.env?.DB;
	if (db) {
		try {
			guideCollections = await getPublicGuideCollections(db, null);
		} catch (error) {
			console.error('Failed to load public guide collections:', error);
		}
	}

	return {
		user: locals.user || null,
		hasAIProviders,
		guideCollections
	};
};

import { redirect } from '@sveltejs/kit';
import { readSetupState } from '$lib/server/setup-state';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, locals }) => {
	if (!platform?.env.KV) throw new Error('KV storage not available');

	// Only a finished installation closes setup. A half-written one still needs this page.
	const { complete } = await readSetupState(platform.env.KV);

	if (complete) {
		// If user is authenticated (logged in), send to admin panel
		if (locals.user) {
			throw redirect(302, '/admin');
		}
		// If not authenticated, send to home page
		throw redirect(302, '/');
	}

	// Allow access to setup page if setup has not been completed yet
	return {};
};

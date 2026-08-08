import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, locals }) => {
	if (!platform?.env.KV) throw new Error('KV storage not available');
	// Check if admin has completed first login
	const [adminFirstLoginCompleted, ownerId, authConfig] = await Promise.all([
		platform.env.KV.get('admin_first_login_completed'),
		platform.env.KV.get('github_owner_id'),
		platform.env.KV.get('auth_config:github')
	]);

	// If setup is locked (admin has logged in), redirect away from setup page
	if (adminFirstLoginCompleted || ownerId || authConfig) {
		// If user is authenticated (logged in), send to admin panel
		if (locals.user) {
			throw redirect(302, '/admin');
		}
		// If not authenticated, send to home page
		throw redirect(302, '/');
	}

	// Allow access to setup page if admin hasn't logged in yet
	return {};
};

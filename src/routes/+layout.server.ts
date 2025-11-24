import type { LayoutServerLoad } from './$types';
import { isAuthorizedUser } from '$lib/auth';

export const load: LayoutServerLoad = async (event) => {
	return {
		session: event.locals.session,
		isAdmin: isAuthorizedUser(event),
		theme: event.locals.theme
	};
};

import { getPatterns, getPrinciples, addPattern, updatePattern } from '$lib/store';
import { requireAuth, isAuthorizedUser } from '$lib/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return {
		patterns: getPatterns(),
		principles: getPrinciples(),
		session: event.locals.session,
		isAuthorized: isAuthorizedUser(event)
	};
};

export const actions = {
	create: async ({ request, ...event }) => {
		requireAuth(event);
		const data = await request.formData();
		const title = data.get('title') as string;
		const description = data.get('description') as string;
		const content = data.get('content') as string;
		const principleIds = data.getAll('principleIds') as string[];

		if (!title || !description) {
			return { success: false, error: 'Title and description are required' };
		}

		addPattern({ title, description, content, principleIds });
		return { success: true };
	},
	update: async ({ request, ...event }) => {
		requireAuth(event);
		const data = await request.formData();
		const id = data.get('id') as string;
		const title = data.get('title') as string;
		const description = data.get('description') as string;
		const content = data.get('content') as string;
		const principleIds = data.getAll('principleIds') as string[];

		if (!id || !title || !description) {
			return { success: false, error: 'ID, title and description are required' };
		}

		const updated = updatePattern(id, { title, description, content, principleIds });
		if (!updated) {
			return { success: false, error: 'Pattern not found' };
		}
		return { success: true };
	}
} satisfies Actions;

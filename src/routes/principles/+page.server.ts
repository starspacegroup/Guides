import { getPrinciples, addPrinciple, updatePrinciple } from '$lib/store';
import { requireAuth, isAuthorizedUser } from '$lib/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return {
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

		if (!title || !description) {
			return { success: false, error: 'Title and description are required' };
		}

		addPrinciple({ title, description, content });
		return { success: true };
	},
	update: async ({ request, ...event }) => {
		requireAuth(event);
		const data = await request.formData();
		const id = data.get('id') as string;
		const title = data.get('title') as string;
		const description = data.get('description') as string;
		const content = data.get('content') as string;

		if (!id || !title || !description) {
			return { success: false, error: 'ID, title and description are required' };
		}

		const updated = updatePrinciple(id, { title, description, content });
		if (!updated) {
			return { success: false, error: 'Principle not found' };
		}
		return { success: true };
	}
} satisfies Actions;

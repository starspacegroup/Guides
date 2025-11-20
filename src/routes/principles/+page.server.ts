import { getPrinciples, addPrinciple } from '$lib/store';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		principles: getPrinciples()
	};
};

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const title = data.get('title') as string;
		const description = data.get('description') as string;

		if (!title || !description) {
			return { success: false, error: 'Title and description are required' };
		}

		addPrinciple({ title, description });
		return { success: true };
	}
} satisfies Actions;

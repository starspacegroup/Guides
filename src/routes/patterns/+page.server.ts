import { getPatterns, getPrinciples, addPattern } from '$lib/store';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		patterns: getPatterns(),
		principles: getPrinciples()
	};
};

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const title = data.get('title') as string;
		const description = data.get('description') as string;
		const principleIds = data.getAll('principleIds') as string[];

		if (!title || !description) {
			return { success: false, error: 'Title and description are required' };
		}

		addPattern({ title, description, principleIds });
		return { success: true };
	}
} satisfies Actions;

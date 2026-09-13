import { PII_REVEAL_COOKIE } from '$lib/server/pii-mask';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const piiRevealed = cookies.get(PII_REVEAL_COOKIE) === '1';

	try {
		const response = await fetch('/api/admin/users');
		if (response.ok) {
			const data = await response.json();
			return {
				users: data.users || [],
				piiRevealed
			};
		}
	} catch (error) {
		console.error('Failed to load users:', error);
	}

	return {
		users: [],
		piiRevealed: false
	};
};

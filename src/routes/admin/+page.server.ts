import { requireAuth } from '$lib/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  requireAuth(event);

  return {
    title: 'Admin Dashboard'
  };
};

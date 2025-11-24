import { getPrinciple } from '$lib/store';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const principle = getPrinciple(params.id);

  if (!principle) {
    throw error(404, 'Principle not found');
  }

  return {
    principle,
    session: locals.session,
    isAuthorized: false // Individual pages are read-only
  };
};

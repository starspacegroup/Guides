import { getPattern, getPrinciple } from '$lib/store';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const pattern = getPattern(params.id);

  if (!pattern) {
    throw error(404, 'Pattern not found');
  }

  // Get related principles
  const relatedPrinciples = pattern.principleIds
    .map(id => getPrinciple(id))
    .filter(p => p !== undefined);

  return {
    pattern,
    relatedPrinciples,
    session: locals.session,
    isAuthorized: false // Individual pages are read-only
  };
};

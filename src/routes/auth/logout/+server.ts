import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  // Clear session cookie
  cookies.delete('atlas_session', { path: '/' });

  throw redirect(302, '/');
};

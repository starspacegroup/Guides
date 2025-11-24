import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { theme } = await request.json();

    if (theme !== 'light' && theme !== 'dark') {
      return json({ error: 'Invalid theme' }, { status: 400 });
    }

    // Set theme cookie with 1 year expiration
    cookies.set('atlas_theme', theme, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: 'lax',
      secure: false
    });

    return json({ success: true, theme });
  } catch (error) {
    console.error('Failed to set theme:', error);
    return json({ error: 'Failed to set theme' }, { status: 500 });
  }
};

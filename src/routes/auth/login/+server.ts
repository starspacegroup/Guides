import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const clientId = env.AUTH_GITHUB_ID;

  if (!clientId) {
    throw new Error('AUTH_GITHUB_ID not configured');
  }

  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();

  // Store state in a cookie
  cookies.set('oauth_state', state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    secure: false
  });

  // Build GitHub OAuth URL
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', `${url.origin}/api/auth/github/callback`);
  githubAuthUrl.searchParams.set('scope', 'read:user user:email');
  githubAuthUrl.searchParams.set('state', state);

  throw redirect(302, githubAuthUrl.toString());
};

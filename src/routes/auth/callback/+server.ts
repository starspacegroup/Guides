import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('oauth_state');

  // Verify state for CSRF protection
  if (!state || !storedState || state !== storedState) {
    throw error(400, 'Invalid state parameter');
  }

  // Clear the state cookie
  cookies.delete('oauth_state', { path: '/' });

  if (!code) {
    throw error(400, 'No code provided');
  }

  const clientId = env.AUTH_GITHUB_ID;
  const clientSecret = env.AUTH_GITHUB_SECRET;

  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error || !tokenData.access_token) {
    console.error('Token exchange error:', tokenData);
    throw error(400, 'Failed to get access token');
  }

  // Get user info from GitHub
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/json',
    },
  });

  const userData = await userResponse.json();

  // Get user emails
  const emailResponse = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/json',
    },
  });

  const emails = await emailResponse.json();
  const primaryEmail = emails.find((e: any) => e.primary)?.email || userData.email;

  // Create session
  const session = {
    user: {
      id: userData.id.toString(),
      name: userData.login,
      email: primaryEmail,
      image: userData.avatar_url,
    }
  };

  // Store session in cookie
  cookies.set('atlas_session', JSON.stringify(session), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secure: false
  });

  throw redirect(302, '/');
};

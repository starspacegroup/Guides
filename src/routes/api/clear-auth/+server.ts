import type { RequestHandler } from './$types';

const ALL_AUTH_COOKIES = [
  'authjs.session-token',
  'authjs.callback-url',
  'authjs.csrf-token',
  '__Secure-authjs.session-token',
  '__Secure-authjs.callback-url',
  '__Secure-authjs.csrf-token',
  '__Host-authjs.csrf-token',
  'authjs.pkce.code_verifier',
  '__Secure-next-auth.callback-url',
  'next-auth.callback-url',
  '__Secure-authjs.pkce.code_verifier'
];

export const POST: RequestHandler = async ({ cookies }) => {
  // Clear all auth cookies
  ALL_AUTH_COOKIES.forEach(name => {
    cookies.delete(name, { path: '/' });
  });

  // Also set them with empty values to force browser to clear
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  ALL_AUTH_COOKIES.forEach(name => {
    headers.append('Set-Cookie', `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax`);
  });

  return new Response(JSON.stringify({ success: true, cleared: ALL_AUTH_COOKIES.length }), {
    status: 200,
    headers
  });
};

import type { Handle } from "@sveltejs/kit";
import { env } from '$env/dynamic/private';

// Session management middleware
const sessionHandler: Handle = async ({ event, resolve }) => {
  // Get session from cookie
  const sessionCookie = event.cookies.get('atlas_session');

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie);
      event.locals.session = session;
    } catch (error) {
      console.error('Failed to parse session:', error);
      event.locals.session = null;
    }
  } else {
    event.locals.session = null;
  }

  // Get theme preference from cookie
  const themeCookie = event.cookies.get('atlas_theme');
  event.locals.theme = themeCookie === 'light' || themeCookie === 'dark' ? themeCookie : null;

  return resolve(event);
};

export const handle: Handle = sessionHandler;

import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export function isAuthorizedUser(event: RequestEvent): boolean {
  const session = event.locals.session;
  const authorizedUserName = event.platform?.env?.AUTHORIZED_USER_NAME;

  if (!session?.user?.name || !authorizedUserName) {
    return false;
  }

  return session.user.name === authorizedUserName;
}

export function requireAuth(event: RequestEvent): void {
  if (!isAuthorizedUser(event)) {
    throw error(403, 'Unauthorized: Only the admin can perform this action');
  }
}

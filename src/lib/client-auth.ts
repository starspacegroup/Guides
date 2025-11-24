// Client-side helper to check if user can edit
export function canEdit(session: any, authorizedUserName?: string): boolean {
  // For client-side, we check if user exists and matches the authorized user
  // The AUTHORIZED_USER_NAME should be passed from the server
  if (!session?.user?.name) {
    return false;
  }

  // If no authorized username is set, no one can edit
  if (!authorizedUserName) {
    return false;
  }

  return session.user.name === authorizedUserName;
}

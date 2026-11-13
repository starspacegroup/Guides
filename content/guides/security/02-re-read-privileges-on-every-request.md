---
title: Re-read Privileges on Every Request
excerpt: A session proves who someone is. What they may do is read from the database on each request, so removing a role takes effect on the next click.
difficulty: intermediate
tags: Authorization, Permissions, Security
---

## Rule

Identity comes from the session. Roles and granted permissions are loaded from the database on every request, and every server load function and endpoint checks them itself.

## Why

If the role is copied into the session at sign-in, removing someone's admin role does nothing until their session expires. For a week-long session that is a week of access after the decision to remove it.

The second half of the rule comes from a specific hole. An admin page relied on its layout to redirect people without access. In SvelteKit a page's server load also runs for a direct request to its `__data.json` address, and that request does not pass through the layout's redirect in the way the page does. The page's data was readable by anyone signed in.

## Must

- Load role and permissions in the server hook, on each request, keyed by the user id from the session.
- Fail closed. If the table is missing or the query throws, the user has no permissions.
- Call a guard such as `requirePermission(locals, 'users')` at the top of every protected `+page.server.ts` load, every form action, and every `+server.ts` handler.
- Make the owner a deployment setting, such as a provider's numeric account id. Do not store it as a role that an admin screen can edit.
- Use the provider's stable numeric id for ownership, never a username. Usernames can be released and claimed by someone else.
- Order roles in a ladder. A user may act only on accounts strictly below their own level, and may grant only levels strictly below their own.

## Pattern

```ts
// hooks.server.ts, after the session is resolved
let permissions: string[] = [];
if (role === 'admin') {
	try {
		const rows = await db
			.prepare('SELECT permission FROM user_permissions WHERE user_id = ?')
			.bind(user.id)
			.all<{ permission: string }>();
		permissions = rows.results.map((row) => row.permission);
	} catch {
		permissions = []; // no table, no grants
	}
}
event.locals.user = { ...user, role, permissions };
```

```ts
// +page.server.ts
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'scheduled-jobs');
	// load the page data
};
```

## Should

- Honour any simulated or "view as" sign-in only in dev builds and only on a loopback host. A forged payload in a production database must not sign anyone in.
- Check form actions as strictly as loads. Actions are separate POST targets, and a guard on the load does not cover them.
- Log every permission change with who made it.

## Gotchas

- The extra query per request is small next to the page's own queries. Do not cache it across requests to save it.
- Hiding a menu item is not access control.
- Tests that mock `locals.user` with a role skip the hook. Add at least one test that runs the real hook against a real database.

## Validation checklist

- Removing a role blocks the user's next request with no sign-out.
- A direct fetch of each admin route's `__data.json` returns 403 for a non-admin.
- An admin cannot change their own role or an owner's.
- With the permissions table dropped, admin pages refuse everyone except the owner.

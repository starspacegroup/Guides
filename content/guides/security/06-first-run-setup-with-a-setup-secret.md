---
title: First-Run Setup Behind a Setup Secret
excerpt: The route that creates the first owner is the most dangerous one in a new deploy. Gate it with a bearer secret, lock it after one use, and undo partial writes.
difficulty: intermediate
tags: Authentication, Deployment, Security
---

## Rule

First-run setup requires a secret that only the person who deployed the app has. It works once, and a failure part way through leaves the app as if setup never ran.

## Why

A new deploy has no users, so its setup route cannot ask anyone to sign in. If the route is open, the first visitor becomes the owner. A crawler or a stranger can be that visitor. One app chose its owner as "the first account to sign in", and the same race applied until an owner was named in configuration.

The undo matters as much as the lock. Setup wrote several keys to a store with no transactions, and the lock was "any setup key exists". A failure after the first write left setup locked with no owner able to sign in. The reset route was owner-only, so the only repair was to edit the store by hand.

## Must

- Require `Authorization: Bearer <SETUP_SECRET>`, where the secret is a platform secret.
- Return 503 when the secret is not configured, and 401 when it is wrong. An unset secret must never mean an open route.
- Compare the header in constant time.
- Identify the owner by the provider's numeric account id. A username can be renamed, released, and claimed by another person.
- Track each key you write. On any failure, delete those keys before you return the error.
- Seal client secrets before you write them.
- After a successful setup, refuse further calls. Only the owner may reset.

## Pattern

```ts
const setupSecret = platform.env.SETUP_SECRET;
if (!setupSecret) throw error(503, 'SETUP_SECRET is not configured');

const header = request.headers.get('authorization') ?? '';
if (!timingSafeEqualStrings(header, `Bearer ${setupSecret}`)) {
	throw error(401, 'Invalid setup credentials');
}

const written: string[] = [];
try {
	for (const [key, value] of entries) {
		await kv.put(key, value);
		written.push(key);
	}
} catch (cause) {
	await Promise.allSettled(written.map((key) => kv.delete(key)));
	throw error(500, 'Setup failed and was rolled back');
}
```

## Should

- Let the same secret repair a half-written installation, so recovery does not depend on an owner who does not exist yet.
- Show the setup page only while setup is open, and return 404 afterwards.
- Remove or rotate the setup secret once the app has an owner.
- Write the setup steps in the README, including where the numeric id comes from.

## Gotchas

- A plain `!==` comparison of the header leaks timing. It is a small leak, and the fix is one shared helper used by every route that takes a secret.
- A setup page that pre-fills from query parameters puts secrets in logs and history. Use a POST body.
- A deploy preview has its own empty store. If previews can run setup, each preview needs the gate too.

## Validation checklist

- Setup without the header returns 401, and with the secret unset returns 503.
- A second setup call after success is refused.
- A forced failure on the last write leaves no setup keys behind.
- The owner signs in after setup, and no other account has owner rights.

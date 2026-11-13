---
title: Session Cookies That Carry Nothing
excerpt: A session cookie is a random token with no data in it. The server stores a hash of the token, and identity lives in the database row the hash finds.
difficulty: intermediate
tags: Authentication, Sessions, Security
---

## Rule

The session cookie holds a random token and nothing else. The database stores the SHA-256 hash of the token as the row id, and the session's contents live in that row.

## Why

An early version of a session cookie was base64-encoded JSON with no signature. It contained the user id and the role flags. Anyone could write their own cookie with `isAdmin` set and take over the admin area. Signing the JSON would have closed that hole and kept two weaker ones: the cookie still could not be revoked, and its contents were still readable.

An opaque token closes all three. There is nothing to forge, deleting the row ends the session at once, and a leaked copy of the sessions table gives no usable cookie, because the table holds hashes.

## Must

- Generate 256 random bits for the token with the platform's secure generator.
- Store only the hash of the token. Hash the incoming cookie on each request, and look up the hash.
- Keep the payload in the session row. Treat a missing row, a missing payload, or an expired row as signed out.
- Set the cookie `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` on HTTPS.
- Rotate on sign-in and on privilege change. Insert the new row and delete the old row in one batch.
- Delete the row on sign-out, and clear the cookie even if the delete fails.

## Pattern

```ts
export function createSessionToken(): string {
	return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashSessionToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
	return bytesToBase64Url(new Uint8Array(digest));
}

export async function readSession(db: D1Database, token: string) {
	const row = await db
		.prepare("SELECT data FROM sessions WHERE id = ? AND datetime(expires_at) > datetime('now')")
		.bind(await hashSessionToken(token))
		.first<{ data: string }>();
	return row ? (JSON.parse(row.data) as SessionData) : null;
}
```

## Should

- Add a test that fails if a cookie value can be decoded into user data. It stops the old design from coming back.
- Keep one session API. Two coexisting helpers, one of which never wrote the payload, produced sessions that resolved to nothing.
- Prune expired rows on the write path, or in a scheduled job.
- A plain SHA-256 is enough here. The token is random and long, so there is nothing to brute force. Passwords are different.

## Gotchas

- Sessions written before the change have no payload. Refuse them, and let those users sign in again.
- A cookie set on `www` is not sent to the apex domain. Redirect to one canonical host.
- If the session dependencies are missing, such as no database binding, fail closed. Do not fall back to trusting the cookie.

## Validation checklist

- The cookie value decodes to random bytes, not to JSON.
- Deleting the session row signs the browser out on the next request.
- A hand-made cookie is refused.
- The sessions table contains no value that works as a cookie.

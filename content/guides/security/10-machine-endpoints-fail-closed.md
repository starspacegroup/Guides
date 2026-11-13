---
title: Machine Endpoints That Fail Closed
excerpt: Cron routes and webhooks have no user to sign in. Give each a secret, compare it in constant time with one shared helper, and answer 503 while it is unset.
difficulty: intermediate
tags: Webhooks, Authentication, Security
---

## Rule

Every endpoint called by a machine checks a secret with one shared constant-time helper. When the secret is not configured, the endpoint returns 503 and does nothing.

## Why

A machine endpoint that is "open until someone sets the secret" is open on every fresh deploy, preview, and staging copy. Returning 503 makes the caller retry later, and the work is not lost.

The shared helper exists because the comparison had been copied into three files, and one of the copies was a plain `!==`. A plain comparison stops at the first different character, so its timing tells an attacker how much of a guess was right.

## Must

- Return 503 when the secret is missing, and 401 when it is wrong.
- Compare with one helper that takes the same time for any input of the same length.
- Verify a webhook signature over the raw request body, before you parse it.
- Reject a signed timestamp that is more than a few minutes old.
- Make the handler safe to run twice. Senders retry, and the same event will arrive again.
- Exempt these routes from redirects, such as a canonical-host redirect. A redirected POST loses its body with some senders.

## Pattern

```ts
export function timingSafeEqualStrings(a: string, b: string): boolean {
	const left = new TextEncoder().encode(a);
	const right = new TextEncoder().encode(b);
	if (left.length !== right.length) return false;
	let difference = 0;
	for (let index = 0; index < left.length; index += 1) {
		difference |= left[index] ^ right[index];
	}
	return difference === 0;
}

export function authorizeCron(request: Request, env: Env) {
	const secret = env?.CRON_SECRET;
	if (!secret) throw error(503, 'CRON_SECRET not configured');

	const header = request.headers.get('authorization') ?? '';
	if (!timingSafeEqualStrings(header, `Bearer ${secret}`)) throw error(401, 'Unauthorized');
}
```

A signed webhook follows the same shape: compute HMAC-SHA-256 over `${timestamp}.${rawBody}` with the endpoint's secret, and compare the result with each signature the sender supplied.

## Should

- Record each event id in a table with a unique index, and skip an id you have already handled.
- Limit the rate of a bearer route even when the token is correct. A token on a stolen phone should buy a few requests an hour, not unlimited use.
- Cap the request body size. Some runtimes default to more than 100 MB.
- Give the route a fixed list of verbs or actions. Never pass a field from the body to a shell, a file path, or a query.
- Keep a way to rotate the secret without downtime: accept the old and the new for a short period.

## Gotchas

- Parsing the body as JSON and then serialising it again changes the bytes, and the signature check fails. Read the text once, verify, then parse.
- The helper above leaks the length of the secret. That is acceptable for long random secrets.
- A 200 response to an unverified webhook tells the sender it was delivered. Use 401, so the mistake shows up in the sender's dashboard.

## Validation checklist

- With the secret unset, the route returns 503.
- A wrong secret returns 401, and nothing runs.
- A replayed webhook with an old timestamp is refused.
- The same event delivered twice changes state once.

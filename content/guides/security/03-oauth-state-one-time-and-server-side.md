---
title: OAuth State: Signed, Stored, and Used Once
excerpt: The state value is a signed cookie and a hashed database row. The callback verifies both and consumes the row in one atomic update, so a replay fails.
difficulty: advanced
tags: Authentication, OAuth, Security
---

## Rule

OAuth state expires, works once, and is recorded on the server. The callback checks a signed cookie against a stored row, then consumes the row with a single `UPDATE ... RETURNING`.

## Why

State stops an attacker from finishing their own sign-in inside your browser. A state value that is only compared with a cookie can be replayed, and it cannot record what the flow was for. A flow that links a second provider to an existing account has to know which signed-in session started it. If it does not, an attacker can link their provider account to your user.

## Must

- Create a random state value, and insert a row keyed by its hash before you redirect to the provider.
- Record the provider, the intent (`login` or `link`), and an expiry of about ten minutes.
- For `link`, record the user id and session id too, and enforce that with a `CHECK` constraint.
- Put the state in a cookie signed with HMAC-SHA-256, scoped to the callback path for that provider.
- In the callback, verify the cookie signature, the state parameter, the provider, and the expiry.
- Consume the row with one atomic statement. If no row is returned, stop.
- Delete the cookie when the row is consumed.
- Accept only same-site paths as the return target.

## Pattern

```ts
const consumed = await db
	.prepare(
		`UPDATE oauth_transactions
     SET consumed_at = CURRENT_TIMESTAMP
     WHERE id = ?
       AND provider = ?
       AND consumed_at IS NULL
       AND datetime(expires_at) > CURRENT_TIMESTAMP
     RETURNING intent, user_id, session_id`
	)
	.bind(await hashState(state), provider)
	.first<{ intent: string; user_id: string | null; session_id: string | null }>();

if (!consumed) throw error(400, 'This sign-in link has expired or was already used');
```

Two requests with the same state both run the update. Only one gets a row.

## Should

- Split verify from consume. Verify first, exchange the code with the provider, then consume. A person who retries after a provider error can then finish.
- Keep provider access tokens only when you call the provider later. If you need the token only to read the profile once, discard it after the callback.
- Require an email address that the provider has verified before you match an OAuth sign-in to an existing account by email.
- Prune expired and consumed rows on the insert path, so no scheduled job is needed.
- Reject a state whose issue time is more than a minute in the future.

## Gotchas

- With Auth.js and GitHub, set the provider's `issuer` to `https://github.com/login/oauth`, with no trailing slash. GitHub began to send the `iss` parameter, the library compares it as an exact string, and every sign-in failed with an error that named only the expected value.
- The signing secret must exist in production. Throw when it is missing, and allow a fallback only in dev builds.
- A cookie scoped to the callback path is not visible to other routes. That is intended.

## Validation checklist

- Replaying a callback URL fails the second time.
- A callback with a state issued for another provider fails.
- A `link` callback opened in a browser with another session fails.
- A return target of another site is replaced with the home page.

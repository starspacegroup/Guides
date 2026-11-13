---
title: Password Hashing on Workers: The PBKDF2 Limit
excerpt: Workers rejects PBKDF2 above 100,000 iterations. Code that uses more passes every local test and returns a 500 for every sign-in in production.
difficulty: intermediate
tags: Cloudflare, Workers, Security, Authentication
---

## Rule

On Cloudflare Workers, hash passwords with PBKDF2-SHA-256 at no more than 100,000 iterations. Treat a stored hash above the limit as a failed check, not as an exception.

## Why

An app used 310,000 iterations, a common recommendation. The Workers runtime throws when asked for more than 100,000. Node and the local test runner do not, so every test passed. In production, password sign-up and sign-in would both have returned a 500. The fault appears only on the real platform.

## Must

- Keep the iteration count at or below the platform limit, in a named constant.
- Store the parameters with the hash: `pbkdf2_sha256$iterations$salt$hash`. You can then raise or lower the count later and still verify old hashes.
- Use a random salt of at least 16 bytes for each password.
- Compare the derived hash with the stored hash in constant time.
- Return `false` and log when a stored hash asks for more iterations than the limit.
- Limit attempts per address before the hash runs. Each attempt costs CPU time, and CPU time is the budget on Workers.

## Pattern

```ts
export const MAX_PASSWORD_ITERATIONS = 100_000;

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [scheme, iterationText, saltText, hashText] = stored.split('$');
	const iterations = Number(iterationText);
	if (scheme !== 'pbkdf2_sha256' || !Number.isInteger(iterations)) return false;

	if (iterations > MAX_PASSWORD_ITERATIONS) {
		console.error(
			`password hash uses ${iterations} iterations; Workers allows ${MAX_PASSWORD_ITERATIONS}`
		);
		return false;
	}

	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveBits']
	);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64Url(saltText), iterations },
		key,
		256
	);
	return timingSafeEqualBytes(new Uint8Array(bits), fromBase64Url(hashText));
}
```

## Should

- Require a minimum length, such as 10 characters, and do not add composition rules.
- Rehash on a successful sign-in when the stored count differs from the current one.
- Prefer sign-in through an identity provider where it suits the product. Then there is no password to store.
- Test the limit in the real runtime. Run the auth tests once under `wrangler dev` or in a preview deploy.

## Gotchas

- 100,000 iterations of PBKDF2 is below current general guidance. It is the most the platform allows, so add throttling and a length minimum to compensate.
- Hashes imported from another system with a higher count cannot be verified on Workers. Those users need a reset.
- An exception in the hash path turns a wrong password into a 500, which leaks nothing and breaks everything. Fail closed with `false`.

## Validation checklist

- Sign-up and sign-in work on a deployed preview, not only locally.
- A stored hash with 310,000 iterations returns `false` and writes one log line.
- Two sign-ups with the same password store different salts and hashes.
- The ninth wrong attempt from one address is refused before any hash runs.

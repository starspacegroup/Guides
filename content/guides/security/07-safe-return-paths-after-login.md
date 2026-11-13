---
title: Safe Return Paths After Login
excerpt: A return-to value must be a path on your own site. Checking for a leading slash is not enough, because browsers read a slash and a backslash as a new host.
difficulty: intermediate
tags: Authentication, Redirects, Security
---

## Rule

Accept a return target only when it is a same-site path. Reject anything that starts with two slashes or a slash and a backslash, and confirm the result by resolving it against a throwaway origin.

## Why

Sending people back to the page they came from is good manners. It is also an open redirect if the value is not checked: a link to your real sign-in page that ends on an attacker's site, with your domain in the address the victim inspected.

The common check, "starts with `/` and does not start with `//`", is wrong. Browsers treat a backslash as a slash in this position, so `/\evil.example` goes to another host. A security sweep found that exact hole in two apps that shared the check.

## Must

- Require a single leading slash that is followed by neither `/` nor a backslash.
- Reject backslashes and control characters anywhere in the value.
- Cap the length.
- Resolve the value against a made-up origin, and require that the origin is unchanged.
- Use one function for every place that reads a return target: the query string, the cookie, and the redirect itself.
- Fall back to the home page. Never fall back to the unchecked value.

## Pattern

```ts
const BASE = 'https://same.invalid';

export function safeReturnPath(value: string | null | undefined): string | null {
	if (!value || value.length > 512) return null;
	if (!/^\/(?![\/\\])/.test(value)) return null;
	if (value.includes('\\') || /[\u0000-\u001f]/.test(value)) return null;

	try {
		const url = new URL(value, BASE);
		if (url.origin !== BASE) return null;
		return url.pathname + url.search + url.hash;
	} catch {
		return null;
	}
}
```

## Should

- Carry the path across an OAuth round trip in the server-side transaction row or in `sessionStorage`, and read it once.
- Decide what sign-out does. From a public page, stay on the page. From a page that needs sign-in, go to the sign-in page with the return target.
- For redirects that an admin manages in a table, check the target again at request time against an allow-list of hosts. A row inserted by hand must not send visitors off site.
- Refuse a redirect whose target is its own source.

## Gotchas

- Encoded forms such as `%2F%2Fevil.example` decode to a double slash. Check the value after decoding, which is what the framework hands you from `searchParams`.
- A return target that points at the sign-out route signs the user out as soon as they sign in. Exclude auth routes.
- Tests must include the backslash case and the double-slash case, or the next refactor brings the bug back.

## Validation checklist

- `/dashboard?tab=2` is accepted unchanged.
- `//evil.example`, `/\evil.example`, and `https://evil.example` are all rejected.
- A value longer than the cap is rejected.
- After sign-in with a rejected value, the browser is on the home page.

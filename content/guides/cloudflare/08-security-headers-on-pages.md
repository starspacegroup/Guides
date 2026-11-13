---
title: Security Headers on Pages: Hook and _headers Together
excerpt: Pages serves static files without running your code. Set headers in the server hook and again in _headers, and test that the two lists match.
difficulty: intermediate
tags: Cloudflare, Security, Deployment
---

## Rule

Set response security headers in the outermost server hook, repeat the same headers in a `_headers` file for static assets, and keep the two identical with a test.

## Why

On Cloudflare Pages a request for a static file never reaches the Worker. Headers set in code cover rendered pages and API routes only. Your images, scripts, and prerendered HTML go out without them unless `_headers` adds them.

## Must

- Put the header hook first in the hook sequence, so early returns from later hooks still get the headers.
- Send `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Strict-Transport-Security` on every response.
- Send `X-Frame-Options: SAMEORIGIN`, or `DENY` if you never frame your own pages.
- Let the framework write the Content Security Policy when it uses nonces. It knows the nonce and you do not.
- Keep comments out of rule blocks in `_headers`.
- Write a test that reads both sources and fails when they differ.

## Pattern

```
# Comments go above a rule block, never inside one.
/*
  Strict-Transport-Security: max-age=31536000
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
```

```ts
export const securityHeadersHandler: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		try {
			response.headers.set(name, value);
		} catch {
			// Some responses have immutable headers. Copy the response to change them.
			const copy = new Response(response.body, response);
			copy.headers.set(name, value);
			return copy;
		}
	}
	return response;
};
```

## Should

- Leave `includeSubDomains` and `preload` off the HSTS header until the owner of the domain decides. Both are hard to undo and affect every subdomain.
- Redirect to one canonical host. A session cookie is bound to the host, so `www` and the apex are two sign-ins. Use 301 for GET and HEAD and 308 for other methods, and exempt webhook and cron routes.
- Mark non-canonical hosts, such as the `pages.dev` address, as `noindex`.

## Gotchas

- A comment inside a rule block makes Cloudflare drop the headers after it, with no warning.
- With the SvelteKit Cloudflare adapter, `_headers` belongs in the project root. The adapter rejects it in `static/`.
- The adapter already writes an immutable cache rule for hashed assets. A second rule of your own is redundant.
- Answer `Range` requests on media routes with 206 and `Content-Range`. Safari will not play video from a server that ignores them.

## Validation checklist

- `curl -I` on a page and on a static asset shows the same security headers.
- The drift test fails when a header is added to only one source.
- The site loads in an iframe only where you intend.
- `www` redirects to the apex, or the apex to `www`, and never both ways.

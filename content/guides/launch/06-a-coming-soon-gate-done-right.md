---
title: A Coming-Soon Gate Done Right
excerpt: Serve the holding page in place with a 503, no-store and noindex. Never gate the owner or the app's own machinery, and treat an unknown setting as off.
difficulty: intermediate
tags: Deployment, SEO, Launch
---

## Rule

A site that is not yet open answers every public page with a holding page: status 503, `Cache-Control: no-store`, and `X-Robots-Tag: noindex`. It is served at the requested URL, with no redirect. The owner, the sign-in routes, the API, and the static assets pass through.

## Why

Each detail prevents a specific problem on launch day.

- **A redirect to `/coming-soon` gets remembered.** Browsers and crawlers store it. On launch day, people who visited early still land on the holding page.
- **A 200 response gets indexed.** Search engines record "Coming soon" as the content of every URL on the site.
- **A cached response outlives the gate.** Without `no-store`, an edge cache or a browser keeps showing the holding page after you open.
- **Gating sign-in locks out the owner.** If `/auth` is behind the gate, nobody can sign in to turn the gate off.

## Must

- Return 503 with the holding page as the body, at the URL that was asked for.
- Send `Cache-Control: no-store` and `X-Robots-Tag: noindex`.
- Let the owner and the admins through after sign-in.
- Exempt the routes the app needs to operate: sign-in, the admin area, the API, webhooks, cron routes, and static assets.
- Match exemptions on whole path segments. `/auth` must not match `/authors`.
- Store the mode in one setting, and treat any value you do not recognise as off.
- Test the exemption list. The list is the contract.

## Pattern

```ts
const EXEMPT_PREFIXES = ['/auth', '/admin', '/api', '/_app', '/favicon.svg', '/robots.txt'];

export function isExempt(pathname: string): boolean {
	return EXEMPT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const siteModeHandler: Handle = async ({ event, resolve }) => {
	const mode = await getSiteMode(event.platform); // cached for a short time
	if (mode !== 'coming-soon') return resolve(event);
	if (isExempt(event.url.pathname)) return resolve(event);
	if (event.locals.user?.isOwner || event.locals.user?.isAdmin) return resolve(event);

	return new Response(renderHoldingPage(), {
		status: 503,
		headers: {
			'content-type': 'text/html; charset=utf-8',
			'cache-control': 'no-store',
			'x-robots-tag': 'noindex'
		}
	});
};
```

This handler runs after the one that resolves the signed-in user.

## Should

- Leave out `Retry-After` unless you know the date. A wrong date is a promise to crawlers.
- Cache the mode for a short time, about 30 seconds, and cache the off state as well. The gate should not cost a storage read on every request for the rest of the site's life.
- Give the holding page one useful thing, such as a sentence about what is coming, and a way to be told.
- Show a visible banner to signed-in admins while the gate is on.
- Record who turned the gate on and off.

## Gotchas

- The exemption list holds things that would break if gated. It is not a list of things that seem harmless. Add a route when the gate would stop the app from working, and for no other reason.
- A share-preview bot gets the 503 too. If you want link cards before launch, exempt the share image and nothing else.
- A staging site behind the gate still needs `noindex` after the gate is off, or it competes with production.
- A setting read from storage can be mistyped. "Unknown means off" keeps a typo from closing the site, and it also means that a typo cannot open a site you meant to keep closed. Check the stored value after you set it.

## Validation checklist

- `curl -I https://your.site/any-page` shows 503, `no-store`, and `noindex`.
- The URL in the browser does not change.
- The owner can sign in, and sees the real site.
- `/authors` is gated, and `/auth/login` is not.
- Turning the gate off shows the real site on the next request, with no cache to clear.

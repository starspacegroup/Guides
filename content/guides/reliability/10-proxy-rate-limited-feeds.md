---
title: Proxy Rate-Limited Feeds Through One Cached Fetch
excerpt: Browsers should not call a rate-limited public feed directly. One server fetch serves everyone, falls back to stale then bundled data, and says which it used.
difficulty: intermediate
tags: Caching, APIs, Reliability, Performance
---

## Rule

A rate-limited or CORS-less upstream is called from one server route with a shared cache. The route answers from fresh data, then stale data, then a bundled snapshot, and every response names its source.

## Why

A public data feed enforces fair use with a temporary 403. If each visitor's browser calls it, your traffic is the feed's traffic, and one busy hour locks everyone out. A server route makes one request serve every visitor.

The fallback order matters because the first request after a deploy may be the one that meets the rate limit. With no stored copy, that visitor sees nothing. A snapshot shipped with the app means there is always real data to show, even if it is old.

## Must

- Fetch the upstream from the server only. Browsers call your route.
- Cache the response with a lifetime that respects the feed's stated limits.
- On an upstream failure, serve the last good copy, marked as stale.
- On a cold start with no copy, serve a snapshot bundled at build time.
- Put the source in a response header and in the body: `fresh`, `stale`, or `bootstrap`.
- After a refusal, back off. Do not ask again on the next request.
- Put a deadline on the upstream call, so a hang falls through to the stale copy.
- Invent nothing. Every tier is real data with a real age.

## Pattern

```ts
export const GET: RequestHandler = async ({ platform }) => {
	const cached = await readCache(platform);

	if (cached && cached.age < FRESH_SECONDS) return respond(cached.body, 'fresh', cached.age);

	if (!inBackoff(cached)) {
		try {
			const response = await fetch(UPSTREAM, { signal: AbortSignal.timeout(12_000) });
			if (!response.ok) throw new Error(`upstream ${response.status}`);
			const body = await response.text();
			await writeCache(platform, body);
			return respond(body, 'fresh', 0);
		} catch {
			await noteRefusal(platform);
		}
	}

	if (cached) return respond(cached.body, 'stale', cached.age);
	return respond(BOOTSTRAP_SNAPSHOT, 'bootstrap', BOOTSTRAP_AGE);
};

function respond(body: string, source: string, age: number) {
	return new Response(body, {
		headers: {
			'content-type': 'application/json',
			'x-data-source': source,
			'x-data-age': String(age)
		}
	});
}
```

## Should

- Use a shorter lifetime for a small, fast-changing subset, and fetch that subset by itself.
- Cap in-memory caches at a fixed number of entries.
- Show the data's age in the interface when the source is not fresh.
- Refresh the bundled snapshot as part of the release process.
- Pin the mapping from upstream fields to your own types with a test that runs against a saved real response.

## Gotchas

- Feeds can update in parts. In one case the small group refreshed while the large group returned 403, so one object was drawn far from its true position until it was given a source of its own.
- A shared cache that keys on the full URL, including a cache-busting parameter, never hits.
- A stale copy with no age limit can be served for weeks after the upstream changed format. Alert on age.

## Validation checklist

- Ten concurrent visitors cause one upstream request.
- With the upstream blocked, the route still answers and reports `stale`.
- On a cold start with the upstream blocked, it answers and reports `bootstrap`.
- A refusal is followed by a quiet period before the next upstream attempt.

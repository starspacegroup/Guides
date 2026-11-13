---
title: Never Cache a Failure
excerpt: "There is none" and "I could not ask" are different answers. Cache the first, retry the second, and keep them as different types so the code cannot mix them up.
difficulty: intermediate
tags: Caching, Error Handling, Reliability
---

## Rule

A lookup has three results: found, not found, and could not ask. Only the first two are cached. The third is raised as its own error type and tried again soon.

## Why

A lyrics lookup cached "no lyrics for this song" for a week. It wrote that entry when the song had no lyrics, and also when the wifi dropped one packet. One bad second made a song blank for seven days.

A second tool asked an archive service for captures of a site. The service answered 429, too many requests. The tool stored that as "no captures exist", and reported it as a fact.

In both cases the code had two outcomes where the world had three.

## Must

- Throw a distinct error, such as `Unreachable`, for timeouts, network errors, 429, and 5xx.
- Write a negative cache entry only after the source answered and said "nothing here".
- Retry an unreachable source after a short delay, with a limit.
- Report failure per source. An empty result must mean that every source answered and had nothing.
- Tell the user which one happened: "no results" or "could not reach the service".

## Pattern

```ts
export class Unreachable extends Error {}

async function lookup(key: string): Promise<Lyrics | null> {
	const cached = await cache.get(key);
	if (cached) return cached.value; // a real hit, or a real miss

	let response: Response;
	try {
		response = await fetch(urlFor(key), { signal: AbortSignal.timeout(6000) });
	} catch {
		// Offline, the service is down, or the timeout fired. Do NOT write a
		// negative entry: that would poison this key over one dropped packet.
		throw new Unreachable('lyrics service unreachable');
	}
	if (response.status === 429 || response.status >= 500) {
		throw new Unreachable(`lyrics service answered ${response.status}`);
	}

	const value = response.status === 404 ? null : ((await response.json()) as Lyrics);
	await cache.set(key, { value, version: CACHE_VERSION });
	return value;
}
```

## Should

- Put a version number in each cache entry, and raise it when the lookup strategy changes. Old misses are then asked again with the better strategy.
- Give negative entries a shorter life than positive ones.
- Back off after a refusal, so a rate-limited source is not asked again at once.
- Keep the last good value, and serve it marked as stale while the source is unreachable.

## Gotchas

- A bare `catch {}` around the fetch is how this bug is usually written. Search for it.
- A 200 response with an error message in the body is also "could not ask". Check the shape of the body, not only the status.
- A default value returned on error, such as zero or an empty list, is a cached failure with no cache. The caller cannot tell it from a real answer.

## Validation checklist

- With the network off, a lookup raises `Unreachable` and writes nothing to the cache.
- With the network back, the same lookup succeeds on the next try.
- A real "not found" is cached and does not hit the source again.
- The interface shows different text for "none" and "unreachable".

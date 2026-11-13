---
title: A Timeout on Every Outbound Call
excerpt: A request with no timeout waits for ever, and it holds a page open while it waits. Set a deadline on every call, and never make a page wait for a slow lookup.
difficulty: beginner
tags: Timeouts, Async, Reliability, Performance
---

## Rule

Every outbound request has a deadline. A page request waits a short, fixed time for slow work, then returns what it has with a status that says the rest is still loading.

## Why

`fetch` has no default timeout. A stalled stream through a tunnel held one page request open with no end, and the browser showed a spinner until the person gave up. In another app, a lookup that tried nine sources at six seconds each could run for almost a minute, while the page that asked gave up after ten seconds. The server kept working for a client that had left.

A hang is worse than an error. An error can be shown, retried, and counted. A hang looks like nothing.

## Must

- Pass `AbortSignal.timeout(ms)` to every `fetch`. About 8 seconds suits an API call, and 2 to 3 seconds suits a health probe.
- Give the whole operation a budget, not only each step. Nine steps at six seconds each is not a six-second operation.
- Cap how long a page request waits for a slow lookup. About 2 seconds is a good limit.
- When the cap passes, return a `looking` state, let the lookup finish in the background, and let the page ask again.
- Treat a timeout as "could not ask". It is not "there is none".

## Pattern

```ts
const response = await fetch(origin, {
	method: 'HEAD',
	signal: AbortSignal.timeout(2500)
});
```

Waiting a bounded time for slow work:

```ts
type Lookup<T> = { state: 'ready'; value: T } | { state: 'looking' };

async function withinBudget<T>(work: Promise<T>, ms: number): Promise<Lookup<T>> {
	const ready = work.then((value) => ({ state: 'ready', value }) as const);
	const waiting = new Promise<Lookup<T>>((resolve) =>
		setTimeout(() => resolve({ state: 'looking' }), ms)
	);
	return Promise.race([ready, waiting]);
}
```

The work continues after the race is lost. Store its result in a cache, so the next poll finds it.

## Should

- Keep long streams, such as media and event streams, off the routes that render pages.
- Make the health route report each dependency with its own timing, so "slow" comes with a name.
- Time out database and queue calls too, where the client allows it.
- On a serverless platform, register background work with `waitUntil`, or it stops when the response is sent.
- Put a deadline of about 12 seconds on calls to third-party feeds, so a hang falls into your stale-cache path.

## Gotchas

- A timeout on the connection alone does not cover a body that arrives slowly. `AbortSignal.timeout` covers the whole exchange, as long as you read the body before it fires.
- Retrying a timed-out call may run the operation twice. Make the operation idempotent first.
- A client timeout shorter than the server's work means the server always does work nobody receives. Line the two up.

## Validation checklist

- A dependency that accepts the connection and never answers produces an error within the deadline.
- A page backed by a slow lookup responds within its cap and fills in later.
- No outbound `fetch` in the codebase lacks a signal.
- The health route names the slow dependency.

---
title: Only the Newest Request May Set State
excerpt: Responses can arrive out of order. Number each request, and let a response update the screen only if no newer request has started since.
difficulty: intermediate
tags: Async, State, Reliability
---

## Rule

Each async read takes a ticket number when it starts. When it finishes, it applies its result only if its ticket is still the newest.

## Why

A mood log refreshed its trend each time the app came to the front. Two refreshes could be in flight together. When the older and slower one finished last, it put a stale trend back on screen, over the fresh one. Nothing had failed. The requests had simply finished in a different order from the one they started in.

The same fault appears in search-as-you-type, in tabs that load data, and in any screen that reloads on focus.

## Must

- Increase a counter at the start of each request, and keep the value in a local variable.
- Before you set state, compare the local value with the counter. If they differ, discard the result.
- Apply the same check on the error path. A stale error must not replace fresh data.
- Cancel the old request too, where the API supports it. The check is still needed, because cancellation is not guaranteed.

## Pattern

```ts
const refreshRequest = useRef(0);

const refresh = useCallback(async () => {
	const ticket = ++refreshRequest.current;
	const [trend, last] = await Promise.all([dailyTrend(7), lastEntry()]);
	if (ticket !== refreshRequest.current) return; // a newer refresh has started
	setTrend(trend);
	setLastEntry(last);
}, []);
```

In Svelte the same idea needs no hook:

```ts
let ticket = 0;

async function search(query: string) {
	const mine = ++ticket;
	const results = await fetchResults(query);
	if (mine === ticket) items = results;
}
```

## Should

- Pass an `AbortController` signal to `fetch`, and abort the previous request when a new one starts. It saves work on both sides.
- Debounce typed input, so fewer requests start.
- Clear the loading flag only for the newest ticket. If an old request clears it, the spinner disappears while the real request is still running.
- Record that a render succeeded only after it has succeeded.

## Gotchas

- One app stored a "rendered for this input" signature before the render ran. The render threw, and the page stayed blank, because the signature said the work was done. Set the marker last.
- Build new content off screen, and swap it in once. Clearing the old content first leaves an empty screen if the build fails.
- Async state inside a component that has been removed is a related fault. The ticket check handles it if removal also increases the counter.
- Float arithmetic in the displayed result is a separate trap. `5.6 - 5.1` is `0.4999999999999996`, so compare scaled integers when a threshold decides a label.

## Validation checklist

- With the first response delayed by two seconds and the second by none, the screen shows the second.
- A failed old request does not show an error over good new data.
- The loading indicator stays until the newest request settles.
- Fast typing in a search box never shows results for an earlier query.

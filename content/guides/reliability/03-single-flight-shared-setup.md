---
title: Single-Flight: Run Shared Setup Once
excerpt: When twenty requests all need the same slow setup, let the first one do it and the other nineteen wait for the same promise.
difficulty: intermediate
tags: Concurrency, Async, Reliability
---

## Rule

Setup that several concurrent callers need is started once. Every caller awaits the same in-flight promise, and the promise is cleared when it settles.

## Why

A lookup tool needed a helper container before it could make network requests. One domain lookup fired about twenty requests at the same moment. Each of them saw "no helper yet" and started one. Nineteen of the twenty failed, because the name was already taken. The code swallowed those errors, so the lookup returned empty results and no message.

The check and the start were two separate steps, and twenty callers ran the check before any of them finished the start.

## Must

- Store the promise, not a boolean. A flag set after the work finishes is too late for callers that arrive during the work.
- Clear the stored promise in `finally`, so a failure is not remembered for ever.
- Make the setup itself tolerate a concurrent winner. Another process may have created the resource first.
- Let the error reach every waiter. Do not turn it into an empty result.

## Pattern

```ts
let helperFlight: Promise<void> | null = null;

export function ensureHelper(): Promise<void> {
	if (!helperFlight) {
		helperFlight = ensureHelperOnce().finally(() => {
			helperFlight = null;
		});
	}
	return helperFlight;
}

async function ensureHelperOnce(): Promise<void> {
	if (await helperIsRunning()) return;
	try {
		await startHelper();
	} catch (cause) {
		// Another process may have won the race. That is success.
		if (await helperIsRunning()) return;
		throw cause;
	}
}
```

For work keyed by an argument, keep a `Map` from key to promise, and delete the entry in `finally`.

## Should

- Use the same shape for token refresh. Many requests that find an expired token should cause one refresh. This matters most when the provider rotates the refresh token on use, because the second refresh then fails and signs the user out.
- Cache the result separately from the flight when the result stays valid. The flight removes duplicate concurrent work, and the cache removes duplicate later work.
- Put a timeout on the shared work, so one hung start does not block every caller.

## Gotchas

- In JavaScript the gap between the check and the assignment must contain no `await`. With an `await` in between, two callers can both pass the check.
- A single-flight inside one process does nothing across processes or Worker isolates. Use a lock in the database or a claim row there.
- Clearing the promise only on success means one failure blocks all later callers until restart.
- Swallowed errors hid this bug for a long time. Empty output with no error is the signature.

## Validation checklist

- Twenty concurrent callers cause exactly one start.
- When the start fails, all twenty callers receive the error.
- A call after a failure tries again.
- A second process starting at the same time does not cause an error in the first.

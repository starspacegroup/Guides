---
title: Retry With Backoff, Jitter, and a Dead Letter
excerpt: Record the work before you call out. Retry transient failures with a growing, randomised delay, stop on permanent ones, and hand what is left to a person.
difficulty: intermediate
tags: Retries, Queues, Reliability
---

## Rule

Durable work is written down before the first attempt. Failures are sorted into transient and permanent. Transient failures retry with exponential backoff and jitter up to a limit, and anything that runs out of attempts goes to a dead-letter state that alerts a person.

## Why

Without a stored record, a crash between "decided to send" and "sent" loses the work with no trace. Without backoff, a failing dependency is hit harder at the moment it is weakest. Without jitter, every client that failed together retries together. Without a dead letter, a job fails for ever, or disappears.

One retry loop had no limit at all. A formal model of it found the case: every attempt failed with the same merge conflict, the failure counter reset itself, and the system paid for a new attempt on every tick with no pause and no alert.

## Must

- Insert the work row, with status `pending`, before you call the provider.
- Classify each failure. Network errors, timeouts, 429, and 5xx are transient. A 400, a 404, or a validation error is permanent.
- Treat an unrecognised failure as transient, with a low attempt limit.
- Compute the delay as `base * 2^attempt`, capped, then multiply by a random factor.
- Stop after a fixed number of attempts, and mark the row `dead`.
- Notify a person when a row dies, with the last error.
- Before you repeat an action, check whether the earlier attempt succeeded on the far side.

## Pattern

```ts
export function nextDelaySeconds(attempt: number, random: () => number = Math.random): number {
	const exponent = Math.max(0, attempt - 1);
	const base = Math.min(BASE_DELAY_SECONDS * 2 ** exponent, MAX_DELAY_SECONDS);
	const jitter = 1 + (random() * 2 - 1) * JITTER_RATIO;
	return Math.max(1, Math.round(base * jitter));
}

export function classify(error: unknown): 'transient' | 'permanent' {
	if (error instanceof ProviderError) {
		if (error.status === 429 || error.status >= 500) return 'transient';
		if (error.status >= 400) return 'permanent';
	}
	return 'transient'; // unknown failures get another try, on purpose
}
```

The random source is a parameter, so a test can fix it.

## Should

- Give every stop a cause and a standing response: retry in a day, wait for a person, or drop. A stop with no cause attached cannot be acted on.
- Give the dead-letter view a "retry now" button and a way to correct the input, such as editing an address.
- Use the platform's dead-letter queue for queue consumers, and create it before the deploy that names it.
- Allow one more attempt a day later for an unknown failure, then hand it to a person. A third blind attempt is a loop with a bill.
- Add a circuit breaker for each dependency, which opens after repeated failures and closes when conditions change.

## Gotchas

- A counter that resets on partial progress can defeat the limit. Count attempts on the work item, and never reset the count.
- Honour `Retry-After` when the provider sends it. It beats your own schedule.
- Retried sends to a chat or mail API can post twice. Send a nonce or an idempotency key.
- Alerts that fire on every retry get muted. Alert on the dead letter.

## Validation checklist

- A provider that returns 500 three times and then 200 produces one successful effect.
- A 400 goes straight to the dead-letter state with no retry.
- Delays grow, differ between runs, and never pass the cap.
- A row that has used all its attempts stops, and a person is told.

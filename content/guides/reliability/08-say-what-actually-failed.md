---
title: Say What Actually Failed
excerpt: A wrong diagnosis on screen is worse than a blank one. Classify the failure, show the upstream's own words, and never draw a zero where the truth is unknown.
difficulty: intermediate
tags: Error Handling, Dashboards, Reliability
---

## Rule

An error message states the kind of failure that happened. A value that could not be loaded is shown as unavailable, never as zero.

## Why

A dashboard widget told its user to "reconnect with the Analytics: Read permission". The real cause was a syntax error in the widget's own query. No change to the token could have fixed it, and the message sent the user to try exactly that.

Another dashboard kept rendering after its session expired. It showed "Unknown Server" above a row of zeros. The numbers looked like data. Nothing on the page said "sign in again".

A guess presented as a diagnosis costs more time than no message at all, because people act on it.

## Must

- Sort upstream failures into kinds you can act on, such as permission, plan limit, and bad query.
- Show the upstream's own message next to your summary.
- Use a distinct state for "could not load". Draw a dash or a notice, not `0`.
- Isolate each call. One failed panel must not blank the whole page.
- Detect an expired session, and say so with a link to sign in.
- When you fall back to less data, such as a shorter time range, label the fallback on the result.

## Pattern

```ts
type FailureKind = 'permission' | 'plan' | 'query';

function classifyAnalyticsError(message: string): FailureKind {
	if (/authentic|permission|forbidden|not authorized|does not have access/i.test(message)) {
		return 'permission';
	}
	if (/time range wider than|plan|upgrade/i.test(message)) return 'plan';
	return 'query';
}

type Panel<T> =
	| { state: 'ready'; value: T; note?: string }
	| { state: 'failed'; kind: FailureKind; upstream: string };
```

A panel in the `failed` state prints its `kind` in plain words and the `upstream` text underneath.

## Should

- After a fix, replay the exact query against the live service before you close the issue.
- Let unknown failures fall into the bucket that points at your own code. Blaming the user's setup by default is how the wrong message above came about.
- Log the full upstream response on the server. If you truncate it, say so in the log line.
- Tell the reader which source answered when there are fallbacks: live, cached, or bundled.
- Keep the last good value, and mark it with its age.

## Gotchas

- Some services scope their schema by permission, so a real permission problem can appear as an unknown-field error. Keep the upstream text visible, because your classifier will sometimes be wrong.
- A logged URL cut at 120 characters once hid the one parameter that mattered, and led to a fix that seemed to work.
- An auth library that labels every failure "Configuration" hides the cause. Route its errors to your own page, and print the detail in dev.
- Placeholder data in a demo mode needs a visible badge, or it will be read as real.

## Validation checklist

- With the upstream returning a query error, the screen says the query failed and shows the upstream text.
- With an expired session, the screen asks the user to sign in, and shows no numbers.
- One failing panel leaves the other panels working.
- No screen shows a zero for a value that failed to load.

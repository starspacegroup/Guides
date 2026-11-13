---
title: A Model Has No Clock
excerpt: A language model does not know the time or anyone's time zone. Give it both on every turn, store real zone names, and refuse to schedule without them.
difficulty: intermediate
tags: AI, Time Zones, Scheduling
---

## Rule

Every request that involves time gives the model the current instant and the user's time zone. Tools that create dated things refuse to run when no time zone is known. Code formats the times people will see, and the model does not.

## Why

An assistant created an event seven hours early. The user had said "8pm". The model had no time zone, so it assumed UTC and showed a confident, well-formatted preview that was wrong. Nothing looked broken.

A model has training data and a prompt. It has no clock. Asked what time it is, it will guess, and the guess will look as sure as a fact.

## Must

- Put the current time, as an ISO instant, and the user's IANA zone in the context of each turn.
- Store zones as `Region/City` names, such as `America/Phoenix`. Never store an offset.
- Enforce "no zone, no scheduling" in the code that executes tools. A line in the prompt is not enforcement.
- Convert the model's answer to an absolute instant in code, and show the user that instant in their zone before saving.
- Pass `now` into pure functions as a parameter, so tests control the clock.
- On a server, pass `timeZone` to every date formatter. The default there is UTC, not the user's zone.

## Pattern

```ts
export function isStorableTimeZone(timeZone: string): boolean {
	const tz = String(timeZone || '').trim();
	if (!tz) return false;
	if (tz.toUpperCase() === 'UTC') return true;
	// Region/City only. "EST" and "EST5EDT" are valid names, and fixed offsets.
	if (!/^[A-Za-z][A-Za-z0-9_+-]*\/[A-Za-z0-9_+\-/]+$/.test(tz)) return false;
	return isUsableTimeZone(tz);
}

function isUsableTimeZone(timeZone: string): boolean {
	try {
		new Intl.DateTimeFormat('en-US', { timeZone });
		return true;
	} catch {
		return false;
	}
}

export function timeContext(now: Date, timeZone: string): string {
	const local = new Intl.DateTimeFormat('en-US', {
		timeZone,
		dateStyle: 'full',
		timeStyle: 'long'
	}).format(now);
	return `Current time: ${now.toISOString()} (${local}). User time zone: ${timeZone}.`;
}
```

## Should

- Where the platform can render a time in each reader's own zone, use that. Discord's `<t:1767225600:F>` syntax shows every reader their local time, so nobody has to convert.
- When the zone is unknown, assume one, show the assumption, and offer to change it. That is kinder than a list of questions.
- Keep relative times relative until the last moment. "In two hours" is computed from `now` in code.
- Test dates around daylight-saving changes and around midnight.

## Gotchas

- Short names such as `EST` and `MST` are valid zone identifiers, and they never observe daylight saving. A user who picks `EST` gets the wrong time for half the year.
- `new Date(year, month, day, hour)` builds the date in the runtime's zone, which on a server is UTC.
- Chat platforms rarely expose a user's zone through their API. You have to ask once, and store the answer.
- A preview that the model wrote is not a check. Render the preview from the stored instant.

## Validation checklist

- With no zone stored, a scheduling tool returns a refusal that asks for one.
- "8pm tomorrow" from a user in a non-UTC zone is stored as the right instant.
- An offset such as `UTC-7` and a short name such as `EST` are rejected as stored zones.
- Tests pass a fixed `now`, and do not depend on the day they run.

---
title: D1 Timestamps: Compare Like With Like
excerpt: An ISO string from JavaScript and datetime('now') from SQLite are different text formats. Compared directly, an expired session stays valid until the end of the day.
difficulty: intermediate
tags: Cloudflare, D1, Database, Security
---

## Rule

Never compare a stored ISO timestamp with `datetime('now')` as raw text. Wrap both sides in `datetime()`, or store and compare one format only.

## Why

SQLite has no date type. Dates are text, and text compares character by character.

- `new Date().toISOString()` gives `2026-11-13T09:30:00.000Z`
- `datetime('now')` gives `2026-11-13 09:30:00`

At the eleventh character one string has `T` and the other has a space. `T` sorts after a space. So `expires_at > datetime('now')` is true for every expiry on the same date, whatever the time. A session that expired at 09:30 stayed valid until midnight UTC. Two separate apps shipped this bug in session checks.

## Must

- Compare with `datetime(expires_at) > datetime('now')`.
- Apply the same form in every place that checks expiry: sessions, OAuth transactions, tokens, leases, and prune jobs.
- Test expiry against real SQLite. A hand-written mock agrees with whatever the code expects, so it hides this fault.
- Include a test case that expired earlier on the same day.

## Pattern

```ts
const row = await db
	.prepare("SELECT data FROM sessions WHERE id = ? AND datetime(expires_at) > datetime('now')")
	.bind(sessionId)
	.first<{ data: string }>();
```

The other correct choice is to produce the ISO format inside SQLite and compare text with text:

```sql
SELECT data FROM sessions
WHERE id = ? AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now');
```

## Should

- Pick one stored format for the whole schema and write it in the migration notes. Integer epoch seconds avoid the question, and they compare and index well.
- Pass the current time in as a bound parameter when you want a test to control the clock.
- Store UTC only, and convert for display.

## Gotchas

- `datetime(column)` in a `WHERE` clause cannot use a plain index on the column. For a large table, store one format and compare without the function, or index the expression.
- `CURRENT_TIMESTAMP` gives the space format too.
- `datetime()` returns `NULL` for text it cannot parse, and a comparison with `NULL` is not true. A badly formatted expiry therefore fails closed, which is the safe direction.
- Local wall-clock text is worse than either format. A clock change or a time zone move reorders rows.

## Validation checklist

- A session that expired one minute ago is refused.
- A session that expired earlier today is refused.
- A search of the codebase for `> datetime('now')` finds no raw column on the left side.
- The expiry tests run against SQLite and not against a mock.

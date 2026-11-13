---
title: Free-Tier Budgets: Count Your Writes and Rows
excerpt: The limits that stop a Cloudflare app are daily counts of KV writes and D1 rows. Keep volatile state out of synced storage, and give every loop a per-run cost.
difficulty: intermediate
tags: Cloudflare, KV, D1, Performance
---

## Rule

Know the daily number each feature spends. Persist only what a person changed on purpose. Give every background loop and every delete a fixed cost per run.

## Why

Three real overruns, each from code that looked harmless:

- A dashboard synced widget settings to KV. Widget titles included live prices and counts, so the settings changed all day. That made about 650 KV writes a day against a free limit of 1,000, for a single user.
- A bot ran a repair-mode aggregation every hour. D1 read between 17 million and 75 million rows a day against a limit of 5 million. An incremental version did about 168 times less work.
- A retention job used one unbounded `DELETE`. On D1 a delete costs a write for each row plus a write for each index entry, so one backlog could spend the whole day's write allowance.

## Must

- Keep volatile display values, such as live titles and counters, in memory. Do not put them in the object you sync.
- Compare with the last saved value and skip the write when nothing changed.
- Make background work incremental. Process what is new since the last run, and run the full repair on a slow schedule.
- Delete in capped batches under one shared row budget, and report when the budget ran out, so the next run continues.
- Express retention as a range on an indexed column. Avoid `NOT IN (SELECT ...)`, which reads the table for every row.
- Never use KV for counters, locks, or rate limits that must be exact. It is eventually consistent, and it limits writes to one key to about one a second.

## Pattern

```ts
const DEFAULT_BUDGET = 5000;

export async function boundedDelete(db: D1Database, options: DeleteOptions) {
	// Number() gives NaN for garbage, and NaN would reach the query as LIMIT NaN.
	const budget = Number(options.budget ?? DEFAULT_BUDGET);
	let remaining = Number.isFinite(budget) ? Math.max(0, Math.floor(budget)) : DEFAULT_BUDGET;
	let deleted = 0;

	while (remaining > 0) {
		const limit = Math.min(remaining, 500);
		const result = await db
			.prepare(
				`DELETE FROM ${options.table} WHERE ${options.keyColumn} IN (
           SELECT ${options.keyColumn} FROM ${options.table} WHERE ${options.where} LIMIT ?
         )`
			)
			.bind(...options.params, limit)
			.run();
		const changes = result.meta.changes ?? 0;
		deleted += changes;
		remaining -= changes;
		if (changes < limit) return { deleted, budgetExhausted: false };
	}
	return { deleted, budgetExhausted: true };
}
```

`table`, `where`, and `keyColumn` are placed in the query text. Pass them only from constants in your own code.

## Should

- Count every request, including bots, redirects, and 404s. On the free plan each one counts toward 100,000 a day for the whole account, and the site stops serving when they run out.
- Pause polling in hidden tabs, and fetch again on `visibilitychange`.
- Give each append-only table a prune job on the day you create the table.
- Measure before you rank a fix by cost. One estimate of Durable Object storage cost was wrong by a factor of 13,000.

## Gotchas

- Constant pushes can starve pulls. The dashboard's sync got worse while it burned quota.
- Skipping unchanged writes is not enough if the data changes every time. Remove the volatile field.
- Analytics queries can report a unit you do not expect. One widget showed CPU time 1,000 times too high because the source reports microseconds.

## Validation checklist

- Each feature has a written estimate of writes and rows read per user per day.
- Leaving a tab open for an hour with no input produces no storage writes.
- The retention job reports `budgetExhausted` and finishes over several runs.
- The Cloudflare dashboard shows daily usage well under each limit at normal traffic.

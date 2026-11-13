---
title: Idempotency Belongs in the Database
excerpt: Webhooks and jobs are delivered more than once. Make the duplicate impossible with a unique index, and claim the work in a single statement.
difficulty: intermediate
tags: Database, Webhooks, Reliability, Concurrency
---

## Rule

An effect that must happen once is protected by a unique constraint. The code claims the work with one insert, and it does the work only if the insert succeeded.

## Why

Payment providers, queues, and schedulers all promise at-least-once delivery. The same event will arrive twice, sometimes within milliseconds. Code that reads "have I sent this receipt?" and then sends it has a gap between the read and the write. Two deliveries both read "no", and the customer gets two receipts, or two shipments.

The database can close the gap, because a unique index is checked inside the write.

## Must

- Choose a key that identifies the effect: the provider's event id, or your own order id with the action name.
- Put a unique index on that key.
- Claim with a single `INSERT`. Treat a conflict as "already handled", and return success.
- Do the side effect after the claim, and record its outcome on the claimed row.
- Send your own id to the downstream provider as its idempotency key or external id, so a retry on your side cannot create a second order on theirs.

## Pattern

A partial unique index lets a failed send be retried, and blocks a second success:

```sql
CREATE TABLE email_log (
  id TEXT PRIMARY KEY,
  template TEXT NOT NULL,
  related_id TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_email_log_sent_once
  ON email_log (template, related_id)
  WHERE status = 'sent';
```

```ts
const claimed = await db
	.prepare(
		`INSERT INTO email_log (id, template, related_id, status)
     VALUES (?, ?, ?, 'sent')
     ON CONFLICT DO NOTHING
     RETURNING id`
	)
	.bind(crypto.randomUUID(), 'receipt', orderId)
	.first<{ id: string }>();

if (!claimed) return; // a replayed webhook: the receipt already went out

const providerId = await sendReceipt(order);
await db
	.prepare('UPDATE email_log SET provider_id = ? WHERE id = ?')
	.bind(providerId, claimed.id)
	.run();
```

## Should

- Keep the row when the send fails after the claim. A `sent` row with no provider id is a call that died in flight, and it should stay visible for a person to check.
- For jobs, add a lease. A claim can be taken over only when the earlier run failed, timed out, or let its lease expire.
- Replace the run id on takeover, and scope every later write to that id. A stale run then cannot overwrite the run that replaced it.
- Return 200 for a duplicate delivery. A 4xx or 5xx makes the sender retry for no reason.

## Gotchas

- A lookup error is never "no order exists". Reading a failed query as an empty result is exactly how a duplicate gets made.
- Claim before or after the effect is a real choice. Claim first means a crash can lose one effect. Effect first means a crash can repeat one. Choose per effect, and write the choice down.
- Idempotency keys kept in a cache with an expiry stop working when the retry arrives after the expiry.

## Validation checklist

- Delivering the same webhook twice sends one email.
- Two deliveries at the same instant produce one row.
- A failed send can be retried and then succeeds once.
- The downstream provider shows one order for one of your ids.

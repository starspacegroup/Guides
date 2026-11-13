---
title: Build Restricted Views Field by Field
excerpt: A view for a guest, a client or the public is built by naming each field it may contain. Spreading the full object leaks whatever is added to it tomorrow.
difficulty: intermediate
tags: Authorization, Privacy, Security, Testing
---

## Rule

Data for a less-trusted reader is constructed from a list of allowed fields. It is never the full object with a few fields removed. Totals and prices that matter are computed on the server and never taken from the client.

## Why

`{ ...record, secret: undefined }` is correct on the day it is written. A month later someone adds `internalNotes` to the record, and the guest view now includes it, because nobody remembered that the view existed. A deny-list fails open. An allow-list fails closed: a new field stays private until someone decides to publish it.

The same reasoning applies in the other direction. An order endpoint stored the prices the browser sent. Anyone could buy at a price of their choosing.

## Must

- Write one projection function per audience, and name every field it returns.
- Put visibility conditions in the query, as a conjunction. A public listing needs opt-in, approval, and fresh data, all in the `WHERE` clause.
- Make optional details, such as a member count, separate switches inside the same projection function.
- Derive the tenant or owner from the session on the server. Ignore any tenant id in the body, the query string, or a header.
- Recompute prices, tax, and totals on the server from stored settings.
- Before you create a payment, check that the line items sum to the order total.

## Pattern

```ts
// A guest's board is built field by field, never `...board`.
export function toGuestBoard(board: Board, grants: Set<string>): GuestBoard {
	return {
		id: board.id,
		title: board.title,
		columns: board.columns
			.filter((column) => grants.has(column.id))
			.map((column) => ({
				id: column.id,
				name: column.name,
				cards: column.cards.map((card) => ({ id: card.id, title: card.title, status: card.status }))
			}))
	};
}
```

A property test keeps it honest:

```ts
fc.assert(
	fc.property(arbitraryBoard, arbitraryGrants, (board, grants) => {
		const view = JSON.stringify(toGuestBoard(board, grants));
		for (const secret of secretsIn(board)) expect(view).not.toContain(secret);
	})
);
```

## Should

- Test isolation as a property: for any crafted request, a reader of tenant A never receives tenant B's rows. Feed the test forged headers, cookies, query parameters, and path segments.
- Fall back to a default view on a bad input. Never fall back to the requested one.
- Charge no tax when the tax settings are missing. A guessed rate is wrong for someone.
- Prefix object storage keys with the tenant id, and build the prefix on the server.

## Gotchas

- Row existence is a poor visibility flag. A community that removed the app stayed listed, because the row was never deleted. Use a freshness condition.
- Operator-only fields, such as a review status, must not be writable through the owner's save form. Use separate actions.
- A serialiser that includes "all own properties" undoes the projection. Return plain objects that you built.

## Validation checklist

- Adding a field to the full record does not change the guest response.
- A request for tenant A with tenant B's id in every header and parameter returns only A's data.
- An order posted with altered prices is stored with the server's prices.
- The property test fails when a secret field is added to the projection.

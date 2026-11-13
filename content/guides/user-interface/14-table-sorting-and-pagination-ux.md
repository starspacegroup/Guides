---
title: Table Sorting and Pagination UX
excerpt: Sort state belongs in the URL, a new sort returns to page one, and the order must be stable or rows will repeat and vanish between pages.
difficulty: intermediate
tags: Data, Tables, Accessibility
---

## Rule

Keep sort and page in the URL. Changing the sort returns to the first page. Every sort has a unique tie-breaker, so a row appears on exactly one page.

## Why

People share table views, reload them, and use the Back button. State held only in memory is lost on all three. An unstable order is worse: when two rows have the same value in the sorted column, the database may return them in a different order on the next request, and a row shows up on page one and again on page two while another never appears.

## Must

- Put `sort`, `dir`, and `page` in the query string, and read them on the server.
- Reset to page one when the sort or a filter changes.
- Add a unique column as the last sort key, such as the id.
- Make each sortable header a real button inside the `th`.
- Set `aria-sort` on the sorted column, and on that column only.
- Show the direction with an icon as well as with `aria-sort`.
- Validate `sort` against a list of allowed columns before it reaches a query.

## Should

- Show the total and the range: "21 to 40 of 312".
- Use a cursor (keyset) for long or fast-changing lists. Offset pagination skips and repeats rows when rows are inserted while someone reads.
- Keep the page size steady, and offer at most a few sizes.
- Keep the old rows visible, dimmed, while the next page loads.

## Pattern

```ts
const SORTABLE = new Set(['name', 'created_at', 'status']);

export function readSort(url: URL) {
	const column = url.searchParams.get('sort') ?? 'created_at';
	const dir = url.searchParams.get('dir') === 'asc' ? 'ASC' : 'DESC';
	return SORTABLE.has(column) ? { column, dir } : { column: 'created_at', dir: 'DESC' };
}

// ORDER BY ${column} ${dir}, id ${dir} : the id makes the order total
```

The column name is placed in the query text, so it must come from the allow-list and never from the request.

## Gotchas

- Sorting only the rows on the current page looks like sorting and is wrong. Sort in the query.
- A page number past the end, after a filter shrinks the list, should show the last page, not an empty table.

## Validation checklist

- Reloading the page keeps the sort and the page.
- A new sort lands on page one.
- No row repeats between page one and page two when many rows share a value.
- A screen reader announces the sorted column and its direction.

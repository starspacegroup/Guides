---
title: Test D1 Code Against Real SQLite
excerpt: A hand-written database mock agrees with whatever the code expects. Run tests through a thin D1 shim over real SQLite, with the real migrations applied.
difficulty: intermediate
tags: Testing, D1, Database
---

## Rule

Code that queries D1 is tested against an in-memory SQLite database that has every migration applied. The mock is a thin adapter, not a fake database.

## Why

A mock database returns what the test told it to return. It never parses the SQL. A typo in a column name, a wrong join, a constraint violation, and a comparison that sorts text the wrong way all pass. The session-expiry bug, where an ISO timestamp was compared with SQLite's own date format, lived for months behind mocks that returned "valid session" on request.

D1 is SQLite. Node ships SQLite. The real thing is available in the test runner for a few lines of adapter.

## Must

- Implement the D1 surface your code uses: `prepare`, `bind`, `first`, `all`, `run`, `batch`, and `exec`.
- Apply every migration file in order to a fresh `:memory:` database for each test file.
- Turn on `PRAGMA foreign_keys = ON`. D1 enforces foreign keys, and plain SQLite does not by default.
- Normalise bind values the way D1 does: `undefined` is an error or null, and booleans become 0 and 1.
- Run `batch` inside a transaction, as D1 does.

## Pattern

```ts
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function createTestDb(): D1Database {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON');

	const dir = join(process.cwd(), 'migrations');
	for (const file of readdirSync(dir)
		.filter((name) => /^\d{4}_.*\.sql$/.test(name))
		.sort()) {
		db.exec(readFileSync(join(dir, file), 'utf8'));
	}
	return asD1(db);
}

function asD1(db: DatabaseSync): D1Database {
	const prepare = (sql: string, params: unknown[] = []) => ({
		bind: (...values: unknown[]) => prepare(sql, values.map(normalise)),
		first: async () => db.prepare(sql).get(...params) ?? null,
		all: async () => ({ results: db.prepare(sql).all(...params), success: true }),
		run: async () => {
			const info = db.prepare(sql).run(...params);
			return { success: true, meta: { changes: Number(info.changes) } };
		}
	});
	return { prepare, exec: async (sql: string) => db.exec(sql) } as unknown as D1Database;
}
```

## Should

- Test the migrations themselves. Build the schema from zero, then assert on the tables and indexes you expect.
- Seed through the same service functions the app uses.
- Use this for sessions, permission checks, and anything with time or uniqueness in it.
- Keep a few mocks for failure injection, such as "the database throws". That is what mocks are good at.

## Gotchas

- `node:sqlite` needs a recent Node. Set the CI Node version on purpose, and note why.
- The SQLite build in Node and the one behind D1 can differ in version. Avoid the newest SQL features unless you have checked both.
- Tests that share one database leak state between them. Create a fresh one for each file, or wrap each test in a transaction.
- A test that exposes a real fault in old code is a result. Fix the code. Do not go back to the mock.

## Validation checklist

- Misspelling a column in a query makes a test fail.
- Inserting a row that breaks a foreign key makes a test fail.
- The expiry test for "expired earlier today" passes.
- A new migration with a syntax error fails the suite.

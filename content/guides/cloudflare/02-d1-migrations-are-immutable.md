---
title: D1 Migrations Are Immutable, and CI Should Say So
excerpt: D1 records applied migrations by file name. Editing an old file changes only new databases, so enforce never-edit and one-number-per-file with a script.
difficulty: intermediate
tags: Cloudflare, D1, Database, Migration
---

## Rule

A migration that has reached the main branch is never edited, renamed, or deleted. A schema change is a new file with the next number, and a CI check enforces both.

## Why

D1 keeps a `d1_migrations` table of file names it has applied. If you edit an applied file, production never runs the change, and a fresh database does. The two now differ, and nothing reports it.

Writing the rule in a README was not enough. In one project it was broken twice before a script enforced it: a branch numbered its migration from its own highest file and produced two files with the same number. In another, four duplicate numbers were counted when the issue was opened and five when it was fixed, because nothing was watching.

## Must

- Name files `NNNN_snake_case.sql`, with one number per file.
- Take the next number from the main branch, not from your own branch.
- Change existing tables with `ALTER TABLE`. Do not recreate them.
- Guard statements with `IF NOT EXISTS` and `IF EXISTS` where SQLite allows it.
- Keep one logical change per file.
- Apply locally first: `wrangler d1 migrations apply <db> --local`.
- Fail CI when a file that exists on the base branch differs, is missing, or shares a number.

## Should

- Have the check say so when it cannot compare against a base branch. A check that silently skips reads as a pass.
- Freeze historical exceptions by full file name, with a comment that the list records history and takes no additions.
- Write data seeds so that they can run twice: `INSERT ... WHERE NOT EXISTS`.

## Pattern

```js
export const MIGRATION_NAME = /^(\d{4})_[a-z0-9]+(?:_[a-z0-9]+)*\.sql$/;

for (const name of files) {
	const match = name.match(MIGRATION_NAME);
	if (!match) problems.push(`${name}: not NNNN_snake_case.sql`);
	else if (seen.has(match[1])) problems.push(`${name}: number ${match[1]} is used twice`);
	else seen.add(match[1]);

	if (onBaseBranch(name) && differsFromBase(name)) {
		problems.push(`${name}: already on the base branch, so it must not be edited`);
	}
}
```

In CI, fetch the base branch before the check runs:

```yaml
- name: Check migrations
  run: |
    if [ -n "$GITHUB_BASE_REF" ]; then
      git fetch --no-tags --depth=1 origin "$GITHUB_BASE_REF"
    fi
    node scripts/check-migrations.mjs
```

## Gotchas

- A merge can force a renumber when two branches took the same number. Renumber the migration that has not landed, and note it in the file header.
- A comment-only edit to an applied migration still fails an honest check. That is correct. Put the note in a new file or in the docs.
- `DROP TABLE` and `DROP COLUMN` cannot be undone by a later migration. Ask a person first.

## Validation checklist

- Editing any migration on the main branch fails CI.
- Two files with the same number fail CI.
- A fresh local database built from all migrations has the same schema as production.
- The newest migration applies twice without an error.

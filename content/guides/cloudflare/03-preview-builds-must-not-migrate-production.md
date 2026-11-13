---
title: Preview Builds Must Not Migrate Production
excerpt: Pages runs one build command for every branch. If that command applies migrations, each pull request preview tries to change the live database.
difficulty: intermediate
tags: Cloudflare, D1, Deployment, Migration
---

## Rule

Only the production branch applies migrations to the production database. A preview build skips remote migrations or uses a database of its own.

## Why

Cloudflare Pages has one build command, and it runs for the production branch and for every preview. A project put `migrate && build` there. From then on, every pull request preview tried to apply its unmerged migrations to the live D1 database. The previews failed only because their token could not write to D1. The tempting fix, giving the preview token write access, would have let any open branch change the production schema.

## Must

- Check the branch inside the migration script, and exit successfully on any branch that is not production.
- Keep the preview deploy token without D1 write permission.
- Give previews their own database when they need a schema, through `preview_database_id`.
- Cover the guard with a test, so a refactor cannot remove it unnoticed.
- Make migrations idempotent, so a retried deploy does not fail on the second run.

## Pattern

Pages sets `CF_PAGES_BRANCH` during a build.

```ts
const pagesBranch = process.env.CF_PAGES_BRANCH;
const productionBranch = process.env.PRODUCTION_BRANCH ?? 'main';

if (!isLocal && pagesBranch && pagesBranch !== productionBranch) {
	console.log(
		`Preview build on "${pagesBranch}": skipping remote migrations ` +
			`(only "${productionBranch}" migrates ${dbName}).`
	);
	process.exit(0);
}
```

## Should

- Log which database was migrated and how many files ran. "32 succeeded, 27 already applied" on every deploy means tracking is broken and files are re-running.
- Run migrations before the new code serves traffic, and write each migration so that the old code still works with the new schema. A deploy is not atomic across the database and the Worker.
- Keep additive changes and destructive changes in separate releases: add the column, ship code that uses it, then drop the old one later.

## Gotchas

- A build that passes on a preview says nothing about the migration, because the preview skipped it. Apply migrations locally before you merge.
- If the production deploy fails after the migration ran, the schema is ahead of the code. Additive migrations make that safe.
- Do not use a preview database that is a copy of production with real user data.

## Validation checklist

- A preview build log shows the skip message.
- The preview token cannot write to the production database.
- The production deploy log lists only new migrations.
- The guard has a unit test for production, preview, and local runs.

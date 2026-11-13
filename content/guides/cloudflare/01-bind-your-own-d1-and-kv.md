---
title: Bind Your Own D1 and KV: Never Copy an Id
excerpt: Cloudflare binds D1 and KV by id and never checks the name. A copied id attaches your app to another project's data, and every query succeeds.
difficulty: intermediate
tags: Cloudflare, D1, KV, Deployment
---

## Rule

Every project owns its D1 database and KV namespace. A template ships placeholder ids, and a guard script fails the build until real, project-owned ids are in place.

## Why

A starter template shipped with real ids in `wrangler.toml`. Six projects were made from it. All six inherited the ids and shared one database and one KV namespace, which held OAuth secrets and an access token. Nothing failed. `database_name` is a label that Wrangler never compares with the account, so each app read and wrote the shared store and every query returned normally. One database ended with 28 tables and the interleaved migrations of four projects.

Three states are wrong, and all three are silent:

- a placeholder is still in place, so you deploy against an id that does not exist
- an id from another project was pasted in, so you join that project's data
- `preview_id` equals `id`, so `wrangler dev` writes into production

## Must

- Ship `REPLACE_ME` placeholders in a template, never live ids.
- Run a guard before `dev`, `build`, and every migration command. Wire it through `predev`, `prebuild`, and `predb:migrate` in `package.json`.
- Fail on a placeholder, on any id known to be shared, and on a preview id equal to the production id. Apply the same test to `preview_database_id`.
- Create resources with a setup script that writes the new ids back, and make it refuse to overwrite real ids unless forced.
- Read the database name from `wrangler.toml` in migration scripts. Do not repeat it in `package.json`.

## Should

- Parse the config line by line with no dependencies, so the guard runs before `install`.
- Offer a warn-only mode for local commands, so a fresh clone can run the dev server before a Cloudflare account exists.
- Keep a separate database and namespace for preview and staging.

## Pattern

```js
const problems = [];
if (/REPLACE_ME/.test(toml)) {
	problems.push('placeholder id left in wrangler.toml');
}
for (const [id, label] of QUARANTINED) {
	if (toml.includes(id)) problems.push(`shared id in use: ${label}`);
}
if (seen.id && seen.preview_id && seen.id === seen.preview_id) {
	problems.push('KV preview_id equals id: wrangler dev would write to production');
}
if (problems.length) {
	for (const problem of problems) console.error(problem);
	process.exit(1);
}
```

## Gotchas

- A template's own CI cannot run a deploy job, because the build fails on placeholders by design. Do not copy that exemption into a real app.
- Moving off a shared database means copying your tables out, not only changing the id. Check which rows are yours first.
- Secrets stored in a shared namespace were readable by every project bound to it. Rotate them after the split.

## Validation checklist

- A fresh clone fails `build` with a message that names the placeholder.
- `wrangler d1 list` shows a database whose id matches `wrangler.toml` and whose tables are only this project's.
- Preview and production ids differ for D1 and for KV.
- The guard runs in CI before the build step.

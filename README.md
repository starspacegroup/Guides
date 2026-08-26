# Guides

Guides is the foundation for guides.starspace.group.

It is a section-based guide platform for the \*Space Discord community where content is published with URLs shaped like:

- /user-interface
- /user-interface/theme-toggles

## Core Idea

- Sections are modeled as CMS content types (for example: user-interface, cloudflare, automation).
- Guide pages are content items within each section.
- Guide bodies are written with the built-in rich text (Markdown-supporting) editor.

## Local Development

```bash
bun install
bun run dev
```

Authentication requires D1, KV, `SESSION_SECRET`, and configured OAuth credentials. Initial
setup additionally requires `SETUP_SECRET` as a bearer token. Turnstile is considered enabled only
when both `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are configured.

## Helpful Routes

- /admin/cms: create and manage sections
- /admin/cms/{section-slug}: create and publish guides in a section
- /{section-slug}: section listing page
- /{section-slug}/{guide-slug}: published guide page

## Cloudflare

This project is configured for Cloudflare Pages, using the Workers runtime with D1, KV, and R2 bindings from `wrangler.toml`.

This is a Cloudflare Pages project. Do not run `wrangler deploy`, which is for Workers projects and will fail for this repository.

Use:

```bash
bun run deploy
```

Or directly:

```bash
bunx wrangler pages deploy .svelte-kit/cloudflare
```

Use:

```bash
bun run db:migrate:list
bun run db:migrate:local
```

`bun run test:coverage` enforces the documented 95% floor for lines, functions, branches, and
statements; CI runs that same gate. Existing D1 migrations are immutable, so schema changes must use
the next sequential migration file.

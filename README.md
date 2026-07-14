# Guides

Guides is the foundation for guides.starspace.group.

It is a section-based guide platform for the *Space Discord community where content is published with URLs shaped like:

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

## Helpful Routes

- /admin/cms: create and manage sections
- /admin/cms/{section-slug}: create and publish guides in a section
- /{section-slug}: section listing page
- /{section-slug}/{guide-slug}: published guide page

## Cloudflare

This project is configured for Cloudflare Pages/Workers with D1, KV, and R2 bindings in wrangler.toml.

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

## Design Decisions

### Logout keeps your place; login brings you back (2026-07-14)

- Logging out from a **public** page keeps the user on that page — session cleared, no redirect away.
- Logging out from a **login-required** page sends the user to `/auth/login`, carrying a return-to reference.
- Logging back in returns the user to the page they were on, not an unconditional landing page.

**Status: not yet implemented.** `src/routes/api/auth/logout/+server.ts` currently redirects to `/auth/login` unconditionally, and the login flow ignores any return-to target. When implementing, validate the return-to value as a same-origin relative path (no absolute or protocol-relative URLs) to avoid an open redirect. The same decision applies to NebulaKit (documented in its planning repo `DECISIONS.md` and `docs/GITHUB_AUTH.md`).

# AGENTS.md

Guidance for AI coding agents working in this repository. This is the canonical guidance file; tool-specific files (CLAUDE.md, .github/copilot-instructions.md) defer to or supplement it.

## What this project is

**Guides** is a section-based guide CMS powering **guides.starspace.group** for the \*Space Discord community. Sections (e.g. `user-interface`, `cloudflare`) are CMS content types; guide pages are content items within them, published at URLs like `/user-interface/theme-toggles`. Built with SvelteKit 2 / Svelte 4 (TypeScript), deployed to **Cloudflare Pages** with D1, and KV bindings. Derived from the NebulaKit starter template (see Related projects).

Runtime/tooling: **bun** (not npm/yarn/pnpm). Dev server is pinned to **port 4255**.

## Commands

```bash
bun install                  # install dependencies
bun run dev                  # dev server at http://localhost:4255 (pinned port, host 0.0.0.0)
bun run build                # production build (vite build)
bun run preview              # preview build on port 4255
bun run check                # svelte-kit sync + svelte-check (type checking)
bun run check:watch          # type checking in watch mode
```

Tests (Vitest unit/integration, Playwright e2e):

```bash
bun run test                 # vitest run (src/**/*.test.ts + tests/, excludes tests/e2e)
bun run test:watch           # vitest watch mode
bun run test:coverage        # vitest with v8 coverage
bun run test:ui              # vitest UI
bun run test:e2e             # playwright test (starts/reuses dev server on 4255)
bun run test:e2e:ui          # playwright UI mode
bun run test:e2e:headed      # playwright headed
bun run test:all             # unit + e2e

# Single test file:
bunx vitest run tests/unit/cms-service.test.ts
bunx playwright test tests/e2e/app.test.ts
```

Validation and database:

```bash
bun run validate:contrast    # WCAG contrast check of theme variables (scripts/validate-theme-contrast.cjs)
bun run validate:all         # check + test + validate:contrast
bun run db:migrate:local     # apply pending D1 migrations locally (always run this first)
bun run db:migrate           # apply pending migrations to remote/production D1 (guides-db)
bun run db:migrate:list      # show applied/pending migration status
bun run deploy               # build + bunx wrangler pages deploy .svelte-kit/cloudflare
```

There is no lint/format script; Prettier (with prettier-plugin-svelte) is configured via `.prettierrc` — use `bunx prettier --write <files>` directly if needed.

## Hard rules

- **bun, not npm.** All scripts and package operations go through bun (`bun run …`, `bun install`, `bunx …`).
- **Port 4255 is pinned** in `package.json` (dev/preview) and `playwright.config.ts` (baseURL + webServer). Do not change it or start servers on other ports. When working interactively on a local workstation, assume `bun run dev` is already running on 4255 — check it before starting another instance.
- **D1 migrations are immutable once applied** (treat anything committed to `main` as applied — D1 tracks them in a `d1_migrations` table). NEVER edit, delete, reorder, or renumber an existing file in `migrations/`. Schema changes go in a NEW file with the next sequence number (`NNNN_description.sql`, currently up to `0014`), using `ALTER TABLE` rather than recreating tables. Test with `bun run db:migrate:local` before `bun run db:migrate`. Full rules in `migrations/README.md`.
- **This is a Cloudflare Pages project, not Workers.** Never run `wrangler deploy` (it will fail); use `bun run deploy` / `bunx wrangler pages deploy .svelte-kit/cloudflare`.
- **Never hardcode colors.** All colors must use CSS custom properties (`var(--color-*)`) defined in `src/app.css`, with both light and dark theme values; text/background pairs must meet WCAG AA (validated by `bun run validate:contrast`).
- **TDD is mandatory.** Write failing tests before implementation. `vite.config.ts` and CI enforce 95% thresholds for lines, functions, branches, and statements. Run `bun run test:coverage` before finishing a task.
- **Minimal external dependencies.** Build in-house (editors, UI components, validation, auth glue) rather than adding npm packages; prefer Cloudflare-native services (D1, KV, R2, Turnstile, Queues). Target the Workers runtime: Web APIs only, no Node-specific APIs or filesystem access.
- **Scratch files go in `.llm-outputs/`** (gitignored). Do not create logs/temp files in tracked directories.

## Architecture

### Routing (src/routes/)

- `/[contentType]` — public section listing; `/[contentType]/[slug]` — published guide page. Both load through `+page.server.ts` querying D1.
- `/admin` — admin dashboard; `/admin/cms` manages sections (content types); `/admin/cms/[type]` lists items in a section; `/admin/cms/[type]/[item]` is the guide editor (rich text / Markdown via `src/lib/components/RichTextEditor.svelte`). Also `/admin/users`, `/admin/ai-keys`, `/admin/auth-keys`. Admin gating lives in `src/routes/admin/+layout.server.ts`.
- `/api/cms/*` — CRUD for content types, items, tags, reorder, and uploads. `/api/admin/*` — users, ai-keys, auth-keys, settings. `/api/auth/*` — custom GitHub and Discord OAuth flows (init + callback), logout, connections. `/api/chat/*` — AI chat streaming/voice endpoints backing `/chat`.
- `/setup` and `/reset` — first-run setup and reset flows.

### CMS content model

Content types are **defined in code** in `src/lib/cms/registry.ts` (`ContentTypeDefinition` in `src/lib/cms/types.ts`: fields, purpose `guide_section` vs `general`, submission policy, visibility) and **synced to D1** by `syncContentTypes()` in `src/lib/services/cms.ts` — the DB rows in `content_types` mirror the registry. Content items live in `content_items` with per-type field data stored as JSON; tags via `content_tags` / `content_item_tags`. Guide sections sort items by `sort_order`; other types by their configured default sort. Parsing/slug helpers are in `src/lib/cms/utils.ts`.

### D1 access pattern

There is no ORM. Cloudflare bindings are reached via `platform.env` (typed in `src/app.d.ts`): `platform.env.DB` (D1) and `platform.env.KV`. Service functions in `src/lib/services/` and `src/lib/utils/db.ts` take a `D1Database` as their first parameter and use **parameterized queries** (`db.prepare(...).bind(...)`) — never string concatenation. Bindings and the `guides-db` database are configured in `wrangler.toml` (`migrations_dir = "./migrations"`).

Tables (from `migrations/`): `users`, `sessions`, `oauth_accounts`, `chat_messages`, `section_contributors`, `guide_revisions`, `content_types`, `content_items`, `content_tags`, `content_item_tags`.

### Auth

Custom cookie-session auth, not a framework flow (`@auth/sveltekit` is installed but the live path is hand-rolled): `src/hooks.server.ts` verifies the signed `session` cookie, resolves its hashed D1 session, and loads `event.locals.user`; missing or invalid auth dependencies fail closed. Shared OAuth transaction and callback orchestration lives in `src/lib/server/oauth-flow.ts`, with provider routes under `src/routes/api/auth/`. Client IDs/secrets come from environment bindings or owner-managed KV configuration. `GITHUB_OWNER_ID` in `wrangler.toml` vars designates the owner/admin.

### Testing layout

Vitest (happy-dom, globals, setup in `tests/setup.ts`) picks up `src/**/*.test.ts` and `tests/**` except `tests/e2e/`, which is Playwright-only. Unit tests live in `tests/unit/` and alongside sources; fixtures in `tests/fixtures/`. Playwright boots (or reuses) the dev server on 4255.

## Related projects

This repo lives in a workspace of independent git repos:

- [../NebulaKit/AGENTS.md](../NebulaKit/AGENTS.md) — NebulaKit, the starter template this project derives from
- [../nabu/CLAUDE.md](../nabu/CLAUDE.md) — nabu, sibling NebulaKit-derived app
- [../sortalizer/AGENTS.md](../sortalizer/AGENTS.md) — sortalizer, sibling NebulaKit-derived app
- [../CLAUDE.md](../CLAUDE.md) — workspace map with the full project list

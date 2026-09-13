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

### Dev tunnel

The dev server runs on port **4255**. A named Cloudflare tunnel exposes it at:

```
https://dev-guides-a5b1c1.starspace.group
```

Config lives at `~/.cloudflared/guides-dev-a5b1c1.yml` (tunnel `guides-dev-a5b1c1`), and
`vite.config.ts` lists `.starspace.group` in `server.allowedHosts` — without that
entry Vite rejects the tunnel's Host header and the public URL returns 403.

Bring both up with `/dev-tunnel`, or by hand:

```bash
systemctl --user start guides-dev guides-tunnel
```


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

## Design Decisions

### Logout keeps your place; login brings you back (2026-07-14)

- Logging out from a **public** page keeps the user on that page — session cleared, no redirect away.
- Logging out from a **login-required** page sends the user to `/auth/login`, carrying a return-to reference.
- Logging back in returns the user to the page they were on, not an unconditional landing page.

**Status: not yet implemented.** `src/routes/api/auth/logout/+server.ts` currently redirects to `/auth/login` unconditionally, and the login flow ignores any return-to target. When implementing, validate the return-to value as a same-origin relative path (no absolute or protocol-relative URLs) to avoid an open redirect. The same decision applies to NebulaKit (documented in its planning repo `DECISIONS.md` and `docs/GITHUB_AUTH.md`).

### Index cards show what a guide is about (2026-09-12)

Section index pages listed every guide as a title, a paragraph, and a date on an
identical card. In a section where six of eight titles start with "Theme" or
"Command Palette", nothing on the page told them apart.

Each card now carries a generated cover. `src/lib/cms/guideVisuals.ts` scores the
guide's own words — title and slug first, then summary and tags, with the section
name as a weak hint — against a topic list, and returns a topic, an accent colour,
and up to two related topics. `src/lib/components/GuideCover.svelte` draws a
distinct motif per topic: a light/dark split for theming, a searchable palette
window for command palettes, keycaps for keyboard, a shield for security, ticked
rows for testing, and so on.

- **Nothing to author and nothing to backfill.** The topic is derived, not stored.
  An author-supplied `featured_image` still wins over the generated motif.
- **Ties break toward the specific.** "Command Palette Accessibility" draws the
  palette and shows Accessibility as a secondary chip, because the palette is the
  subject and accessibility is the angle.
- **Both themes.** Motifs mix their neutral parts from `--color-text`, so the same
  drawing reads on a white page and a black one. The theming motif is the
  deliberate exception: it paints a fixed light half and dark half, because that
  contrast is the subject.

### The root font size is fluid (2026-09-12)

`html` sets `font-size: clamp(17px, 0.98vw + 13.2px, 22px)`. **22px is the base the
whole rem scale is tuned against and is reached at 900px and up**, so desktop is
unchanged; below that it falls to 17px on phones. It used to be a flat `22px`,
which made every rem 37% larger than the layout assumed — an `h1` rendered at
~60px on a 390px screen. If a component looks right on desktop and oversized on a
phone, check whether it is sizing in `rem` against the wrong assumption.

Related: grid columns in the article layout are declared `minmax(0, 1fr)`, never
left implicit. An implicit `auto` track takes its minimum from the item's
automatic minimum size, and the code-examples sidebar's min-content once blew the
single mobile column out to 1910px inside a 390px viewport. `tests/unit/mobile-layout.test.ts`
pins both fixes.

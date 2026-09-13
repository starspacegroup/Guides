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

# Guides

Guides is the foundation for guides.starspace.group.

It is a section-based guide platform for the *Space Discord community where content is published with URLs shaped like:

- /user-interfaces
- /user-interfaces/theme-toggles

## Core Idea

- Sections are modeled as CMS content types (for example: user-interfaces, cloudflare, automation).
- Guide pages are content items within each section.
- Guide bodies are written with the built-in rich text (Markdown-supporting) editor.

## Local Development

```bash
npm install
npm run dev
```

## Helpful Routes

- /admin/cms: create and manage sections
- /admin/cms/{section-slug}: create and publish guides in a section
- /{section-slug}: section listing page
- /{section-slug}/{guide-slug}: published guide page

## Cloudflare

This project is configured for Cloudflare Pages/Workers with D1, KV, and R2 bindings in wrangler.toml.

Use:

```bash
npm run db:migrate:list
npm run db:migrate:local
```

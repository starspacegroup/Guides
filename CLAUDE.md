# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Guides is a section-based guide CMS for guides.starspace.group, built with SvelteKit 2 / Svelte 4 on Cloudflare Pages with a D1 database, derived from the NebulaKit starter template. It uses **bun** (never npm) for all scripts and package management, and the dev server is pinned to **port 4255** (`bun run dev`). D1 migrations in `migrations/` are immutable once applied — add new sequential files instead of editing, and test with `bun run db:migrate:local` first.

**Refer to [AGENTS.md](AGENTS.md) for canonical commands, architecture, and rules.**

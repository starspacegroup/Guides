---
title: AGENTS.md as a Ledger of Real Failures
excerpt: A rules file for coding agents earns its place one verified failure at a time. Each rule names what went wrong, and anything an agent would get right anyway is left out.
difficulty: beginner
tags: AI, Coding Agents, Documentation
---

## Rule

Add a rule to the agent guidance file only when a failure happened, was verified, and was not obvious. Write the cause next to the rule. Keep one canonical file, and make tool-specific files point at it.

## Why

A rules file that says "write clean code" and "follow best practices" tells an agent nothing it did not already assume. The useful lines are the ones no reader could guess:

- This project deploys to Pages. `wrangler deploy` is for Workers, and it fails here.
- A keyframe animation on `border-radius` took the performance score from 100 to 60.
- The screenshot rule switches on the `data-theme` attribute, not on the system colour scheme.

Each of those cost someone an afternoon once. Written down with its cause, it costs nobody an afternoon again.

## Must

- State each rule as an instruction, and give the reason in the same line or the next.
- Keep one canonical file. Other tool files hold one paragraph and a link.
- List the real commands: install, dev, test, a single test, build, deploy. Agents run what the file says.
- Name the things that look right and are wrong here, such as the wrong package manager, the wrong deploy command, or a port that must not change.
- Say where scratch output goes, and ignore that folder in git.
- Mark generated files and folders as not to be edited by hand.
- Forbid reporting a check as passing without having run it and read the result.

## Pattern

```markdown
## Hard rules

- **bun, not npm.** The lockfile is bun.lock, and a second lockfile drifts.
- **Port 4255 is pinned** in package.json and the Playwright config. A dev
  server is probably already running there: check before you start another.
- **Migrations are immutable once merged.** D1 records them by file name, so an
  edit changes new databases only. Add a new file with the next number.
- **This is a Pages project.** Never run `wrangler deploy`. Use `bun run deploy`.
- **Never hardcode a colour.** Use the CSS custom properties: both themes must
  pass `bun run validate:contrast`.
- **Scratch files go in .llm-outputs/** (gitignored), never in tracked folders.
```

## Should

- Keep the file under about 200 lines. Move architecture notes and subsystem detail to linked docs.
- Date the rules that came from an incident.
- Ask the agent to read the task list and check `git status` before it edits. Other sessions may have changes in progress.
- Review the file when a rule is broken. Either the rule is unclear, or it is no longer true.
- Delete rules about tools you have stopped using.
- Tell the truth about what is not done. A design decision that is recorded and not implemented should say so.

## Gotchas

- Prose drifts from the code. One file said migrations ran to number 19 when the folder held 25. Avoid counts that go stale, or generate them.
- Section numbers cited from source files make the file hard to reorganise. One renumbering touched fourteen files. Cite by heading.
- A rule that is only prose gets broken. If a script can check it, write the script, and let the file point at the script.
- Two guidance files with overlapping rules will contradict each other within weeks.

## Validation checklist

- Every rule has a reason a newcomer could repeat.
- Every command in the file runs as written.
- No rule restates general good practice.
- A new session, given only this file, avoids each listed trap.

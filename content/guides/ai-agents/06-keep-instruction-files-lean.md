---
title: Keep Agent Instruction Files Lean
excerpt: Everything in an always-loaded instruction file is paid for on every turn of every session. Keep rules and pointers there, and move subsystem detail to docs read on demand.
difficulty: beginner
tags: AI, Coding Agents, Documentation
---

## Rule

The instruction file an agent loads at the start of every session holds rules that apply to every task, and pointers to everything else. Detail about one subsystem lives in a doc that the agent reads when it works on that subsystem.

## Why

One repository's instruction file had grown to about 9,700 tokens. Splitting it brought the always-loaded part down to about 1,900. Nothing was deleted. The detail moved into a `docs/` folder, and the main file gained one line: before you change, debug, or explain a subsystem, read its doc first.

That saved roughly 7,800 tokens on every turn of every session. The saving is not only cost. A model that reads forty rules, of which three apply, follows the three less reliably.

The file grew again over the following months. The diet is a chore to repeat, not a job to finish.

## What counts as always loaded

| Source                                               | Cost                                                |
| ---------------------------------------------------- | --------------------------------------------------- |
| Instruction files in the repo and its parent folders | the whole file, every turn                          |
| The name and description of every skill or command   | every turn                                          |
| Tool schemas from connected servers                  | every turn, about 500 tokens for each loaded schema |
| A memory index                                       | every turn                                          |

## Must

- Open the main file with the read-the-doc-first instruction.
- Keep one pointer line for each subsystem doc: the path, and when to read it.
- Give every rule its reason in a clause. A rule with no reason gets argued with, or applied where it does not fit.
- Add a rule only for a failure that happened and was not obvious.
- Put commands and architecture in a separate file from the rules.
- Cut before you add. When a new rule goes in, look for one to move out.

## Pattern

```markdown
# Project rules

Before you change, debug, or explain any subsystem, read its doc first.

| Subsystem | Doc                    | Read when                            |
| --------- | ---------------------- | ------------------------------------ |
| Payments  | docs/payments.md       | touching checkout, webhooks, refunds |
| Scheduler | docs/scheduled-jobs.md | adding or changing a cron job        |
| Theming   | docs/theme-system.md   | adding a colour or a theme           |

## Hard rules

- Migrations are immutable once merged: D1 records them by file name.
- Never hardcode a colour: both themes must pass the contrast check.
```

## Should

- Keep descriptions of skills and commands under about 40 words. The body costs nothing until it is used.
- Estimate size as words times 1.3 for prose and characters divided by 4 for code. Say that it is an estimate.
- Record the total each time you trim, so growth is visible.
- Date each rule. A rule from a year ago about a tool you no longer use is noise.
- Review the file when you notice the agent ignoring it.

## Gotchas

- A lean file can hide things. A reviewer once reported a component as undocumented because it was absent from the main file. It was in its own doc, on purpose. Keep the pointer table complete.
- Two copies of the same table will drift. Keep one, and link to it.
- Stale lines in an always-loaded file are worse than stale lines elsewhere, because they are obeyed.
- Section numbers that other files cite are fragile. Search for the citations before you renumber.

## Validation checklist

- The always-loaded file fits on about two screens.
- Every subsystem doc has a pointer line in the main file.
- Every rule states its reason.
- A fresh session can find the right doc for a task from the main file alone.

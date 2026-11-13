---
title: An Umbrella Repo for Thinking, a Nested Repo for Code
excerpt: Keep plans, brand work and decisions in one repository and each deployable app in its own repository inside it, ignored by the outer one. Never mix the two histories.
difficulty: beginner
tags: Planning, Git, Process
---

## Rule

A project is an umbrella repository that holds plans, design, research, and decisions. Each code project is a separate git repository in a subfolder, listed in the umbrella's ignore file. The umbrella tracks thinking, and the code repositories track building.

## Why

Plans and code change at different speeds, for different readers. In one repository, a week of design exploration buries the code history under mockup commits. The deploy pipeline runs because a planning note changed. A public code repository carries private positioning notes with it.

Two repositories keep both histories readable. The code repository can be public, forked, and deployed. The umbrella can hold what is unfinished, private, or only half believed.

## Layout

```
MyProject/                  umbrella repo
  README.md
  ROADMAP.md
  planning/
    DECISIONS.md
    IDEAS.md
  design/
    brand/NAMING.md
    logos/
  graphics/mockups/
  docs/guides/
  .gitignore                contains /myproject/
  myproject/                code repo, with its own .git
```

## Must

- List each nested code folder in the umbrella's `.gitignore`.
- Give the umbrella a `bootstrap.sh` that clones the code repositories into place on a fresh machine.
- Record decisions as dated entries, each with the decision, the reason, and the consequences.
- Choose one source of truth for the roadmap, and write down which it is.
- Keep unscheduled ideas in their own file, not in the roadmap.
- Keep private planning out of the code repository.

## Pattern

A decision entry:

```markdown
## 2026-08-24 - Only the production branch migrates the database

**Decision.** The build skips remote migrations on preview branches.

**Why.** The platform runs one build command for every branch, so each
preview tried to apply unmerged migrations to the live database.

**Consequences.** Previews that need a new schema get their own database.
The preview token stays without database write access.
```

The roadmap rule, as written in one umbrella:

```markdown
- The app repo's roadmap is the source of truth for implementation status.
- The "Workspace-only planning" section in this repo's ROADMAP.md is never
  copied into the app repo.
- Unscheduled ideas go in planning/IDEAS.md, not the roadmap.
```

## Should

- Write a decision down when you make it, including the option you rejected. The rejected option is what people ask about later.
- Treat a public claim as unverified until it has a date and a source.
- Keep a short list of things not to say publicly yet, next to the brand notes.
- Date every figure in research notes, and name what the source does not answer.
- Mark anything unsourced as unverified, or as an inference.

## Gotchas

- Two projects that use opposite rules for where the roadmap lives will confuse anyone who works on both. Choose one convention across projects.
- A nested repository that is not ignored shows up in the umbrella as an untracked folder, or worse, gets added as a broken submodule entry.
- Docs in the umbrella drift from the code. When a doc states that the code does something, link to the file that does it.
- An umbrella with no bootstrap script works only on the machine it was made on.

## Validation checklist

- `git status` in the umbrella is clean while the code repository has changes.
- A fresh clone followed by the bootstrap script gives a working tree.
- The latest three decisions have dates and reasons.
- The code repository contains no private planning notes.

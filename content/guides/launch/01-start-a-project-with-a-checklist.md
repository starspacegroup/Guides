---
title: Start a Project With a Kickoff Checklist
excerpt: Before any app code, write down why the name was chosen, make a logo, draw mockups at phone and desktop width, and write a one-page plan.
difficulty: beginner
tags: Planning, Design, Process
---

## Rule

A new project begins with four artifacts, in this order: the name story, a logo, mockups, and a plan. App code comes fifth.

## Why

Each of the four is cheap on day one and expensive later.

- **The name story is the part nobody can rebuild.** Six months on, nobody remembers why the project is called what it is, which names were rejected, or what the name was meant to suggest. The reasoning exists on the day of the decision, and never again.
- **A logo makes the project findable.** A project with a mark gets a recognisable tab, launcher icon, and share card. A project with a placeholder looks abandoned, to you as much as to anyone.
- **Mockups catch layout mistakes before they are code.** A screen that does not fit at phone width is a five-minute fix in a drawing, and a day of work in components.
- **A plan says what done means.** Without one, the project has no first milestone, only momentum.

## The checklist

- **Name story.** Write `NAMING.md` on the day you choose the name: why this name, what it should bring to mind, and which names you turned down. A later rename adds a dated section. It never deletes the old one.
- **Logo.** Put a master file and the exports in `design/logos/`. Generate every size from the master.
- **Mockups first.** Draw the main screens at phone width and desktop width, in light and dark. Build to them. Look at them again after you build. A screen that has drifted from its mockup is either a mockup to update or a bug.
- **Plan.** One file for each idea, in `plans/`, with a status line at the bottom.

## Standards from the first commit

- Light and dark themes that follow the system by default, and switch live.
- A command palette that works on a phone as well as with Ctrl or Cmd and K.
- Design at 390px wide first.
- Verify by screenshot at 390 and 1440 pixels wide, in each theme.
- Secrets ignored by git from the first commit: `.env`, `.dev.vars`, and key files.

## Pattern

A small script turns the checklist into a habit:

```bash
#!/usr/bin/env bash
# new-project.sh <Name> [code-dir...]
set -euo pipefail
name="$1"; shift

cp -r skeleton "$name"
sed -i "s/{{NAME}}/$name/g; s/{{DATE}}/$(date +%F)/g" "$name/README.md" "$name/design/brand/NAMING.md"

git -C "$name" init -q
for code_dir in "$@"; do
  mkdir -p "$name/$code_dir"
  git -C "$name/$code_dir" init -q
  echo "/$code_dir/" >> "$name/.gitignore"
done

echo "Next: write the name story in $name/design/brand/NAMING.md"
```

The skeleton holds the README, the agent rules file, the ignore file, the empty folders, and the public-page guides.

## Should

- Copy the skeleton. Do not rewrite it for each project. Conventions stay the same across projects because they are the same file.
- Keep mockups as HTML with a capture script. To change one, edit the source and capture again. Never edit the image.
- Review the skeleton after each project, and fold in what you had to add by hand.

## Gotchas

- A README left as the unfilled template is worse than none. Fill it in, or delete it.
- Mockups in one theme at one width are a third of the work. The other combinations are where the surprises are.
- "We will name it properly later" means every path, package name, and domain gets renamed later too.

## Validation checklist

- `NAMING.md` exists, and it explains the name to a stranger.
- The logo appears in the browser tab and in the share card.
- Mockups exist for the main screens at both widths and in both themes.
- The plan states the first milestone, and how you will know it is reached.

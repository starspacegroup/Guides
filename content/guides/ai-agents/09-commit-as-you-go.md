---
title: Commit as You Go, With a Checkpoint Backstop
excerpt: A coding agent commits each finished unit of work locally, with specific paths, and never pushes. A session-end hook catches whatever was left uncommitted.
difficulty: intermediate
tags: AI, Coding Agents, Git
---

## Rule

An agent makes a local commit when a unit of work is done, and always before it changes topic. It stages the files it touched and nothing else. It never pushes without being asked. A hook at session end commits anything the session left behind.

## Why

An audit rule that flagged repositories with uncommitted work older than three weeks fired on eighteen repositories at once. They held finished work: three sites with the same completed change, a documented fix, test suites, and one whole program. Each session had done the work, reported success, and ended. Nothing was lost, and all of it could have been.

Uncommitted work has no history, no description, and no protection from the next session's `git checkout`.

## Must

- Commit at the natural boundary: one feature, one fix, or one pass over the docs.
- Stage by path. Never run `git add -A`. A working tree often holds files changed by other tools and other sessions.
- Write a message that says what changed and why.
- Keep commits local. Pushing, opening a pull request, and creating a remote branch each need an explicit request.
- Commit before you switch to an unrelated task.
- Report the commit in one line. Do not ask permission for each one.

## The backstop hook

A session-end hook is the floor. It runs when a session closes, and it commits what that session left.

- It takes only files modified since the session began.
- It refuses paths that look like secrets, whatever `.gitignore` says.
- It skips tool state folders.
- It does nothing during a rebase, a merge, or a cherry-pick, or on a detached HEAD.
- It never pushes.
- It always exits 0, so a fault in the hook cannot block the session from closing.

```bash
SECRET_RE='(^|/)(\.env([.]|$)|.*\.(pem|key|p12|pfx)$|.*(secret|token|credential|passw)[^/]*$)'

while IFS= read -r file; do
  if [[ "$file" =~ $SECRET_RE ]]; then
    log "REFUSED secret-shaped path: $file"
    continue
  fi
  git add -- "$file"
done < <(files_changed_since "$SESSION_START")

git commit -q -m "WIP checkpoint at session end" || git reset -q
```

A checkpoint commit in the log means a session skipped the rule above. Treat it as a signal, not as normal practice.

## Should

- Give the hook a dry-run mode, so you can test it without ending a real session.
- Log each run to a file: the repository, the file count, and any refusals.
- Reset the index if the commit fails, so nothing is left half staged.
- Branch first when the work is consequential and you are on the main branch, if the work is headed for review.

## Gotchas

- A hook that commits with verification skipped bypasses pre-commit checks. That is a deliberate trade for a checkpoint, and it is one more reason the checkpoint is not the standard.
- A deleted file has no modification time. Decide how the hook treats deletions.
- Committing someone else's half-finished change in a shared tree is the failure this design avoids. The "modified since session start" filter exists for that.
- Agents that are told to commit "automatically" may also push, unless the rule says in plain words that they must not.

## Validation checklist

- After a session, `git status` is clean, or holds only files the session did not touch.
- The log reads as a sequence of real units, with few checkpoint commits.
- No commit contains a file that looks like a secret.
- Nothing was pushed without a request.

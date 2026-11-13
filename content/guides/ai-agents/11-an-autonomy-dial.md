---
title: An Autonomy Dial, and a Cause for Every Stop
excerpt: One setting decides how much an agent system may do by itself. Every time it stops, it records why, what happens next, and who owns the next move.
difficulty: advanced
tags: AI, Automation, Coding Agents
---

## Rule

A system that runs agents has one autonomy setting with named levels. Every stop carries a cause, a standing response, and an owner.

## Why

Autonomy spread across a dozen flags cannot be reasoned about. Nobody can say what the system will do tonight. One dial can be read, set, and lowered in a hurry.

The second half of the rule comes from a queue of 35 held tasks with no reason attached to any of them. Some were waiting for a person, some for a quota window, and some had hit an error. All of them looked the same. In another case a name collision stopped a schedule for a week, and the only sign was that nothing happened.

## The levels

| Level      | The system may                          |
| ---------- | --------------------------------------- |
| off        | do nothing                              |
| propose    | say what it would do, and do none of it |
| supervised | act after a person approves each step   |
| autonomous | act, and report                         |
| unattended | act on a schedule with nobody watching  |

## Must

- Hold the setting in one place, and read it before every action.
- Combine limits by taking the lowest. A project limit, a global limit, and a task limit give the minimum of the three.
- Never let the system raise its own level.
- Run at `propose` for a week before you allow more, and read what it refused as well as what it proposed.
- Provide a pause that always expires. A pause with no end becomes a forgotten outage.
- Record each stop with a cause from a fixed list.
- Give each cause one standing response: retry after a delay, wait for a named person, or drop.

## Pattern

```rust
pub fn response_for(cause: Cause) -> Response {
    match cause {
        Cause::QuotaExhausted => Response::RetryAtWindowReset,
        Cause::NeedsApproval => Response::WaitFor(Owner::Human),
        Cause::MergeConflict => Response::WaitFor(Owner::Human),
        // Unknown failures get one more try after a day (a flaky network, a
        // full quota window), then a person: a third blind attempt is a loop
        // with a bill.
        Cause::FailedTwice => Response::RetryAfterHours(24),
        Cause::FailedThrice => Response::WaitFor(Owner::Human),
    }
}
```

## Should

- Add a circuit breaker for each project. It opens after repeated failures, and it closes only when something has changed, such as a new commit.
- Prove the gate before each automatic run. Check that the level, the quota, and the working tree allow it.
- Make writes to shared state compare-and-set. Three writers that each saved a whole file once removed an entry with no error, and the loss cost six days.
- Record a process's start time with its id, because an id alone can be reused.
- Make a daemon exit when its supervisor loop dies. One kept answering health checks while it did no work.
- Show the held queue grouped by cause, with the owner's name beside each group.

## Gotchas

- "Retry on failure" without a count is an unbounded loop. A formal model of one retry rule found a case where the failure counter reset on every other attempt, so the limit was never reached.
- A test that wrote to the real state file cut it from thousands of lines to a few dozen. Tests must be unable to reach the real file.
- Autonomy for reading and autonomy for writing are different risks. Consider a separate, lower limit for actions that reach other people.
- A system at `unattended` needs alerts that a person will see. Alerts nobody reads are the same as no alerts.

## Validation checklist

- Setting the dial to `off` stops all activity within one cycle.
- No code path raises the level.
- Every held item shows a cause and an owner.
- A pause set for an hour ends by itself.
- A task that fails three times stops, and a person is told.

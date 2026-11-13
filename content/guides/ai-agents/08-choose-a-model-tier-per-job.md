---
title: Choose a Model Tier per Job, and Write It Down
excerpt: Name the model tier for each automated job in one registry file, with the reason and the date you last judged it. Scripts read the registry and never hard-code a model.
difficulty: intermediate
tags: AI, Automation, Cost
---

## Rule

Work at the cheapest model tier that does the job, and move up on purpose. Each automated job's tier is recorded in one file with a reason and a date. Every script reads that file.

## Why

Model choices get made once and then forgotten. A set of background jobs had tiers picked by hand in July. New models shipped, prices changed, and nobody looked again, because the choice was spread across a dozen scripts.

An unpinned choice is worse. A bot launcher with no model set fell back to the account default, which was the most expensive tier. It answered a public channel all night at up to a dollar and a half for each message.

## Must

- Keep one registry file. Each entry has the job, the tier, what uses it, why, and the date it was last judged.
- Refer to tiers by alias, such as small, medium, and large. Do not use version-pinned names, so a new version needs no edit.
- Have scripts ask the registry, and pass a fallback. A broken registry must not switch a job off.
- Pin a model on everything that runs unattended. Never let it take the account default.
- Define what makes you look again: a model launch, a price change, or a retirement notice.
- When you look again, update the date on every entry you considered, including those you left alone. The date then means "looked at".

## Pattern

```yaml
jobs:
  - job: headline-judge
    tier: small
    consumer: the news watchers, every 15 to 30 minutes
    why: yes or no classification of a headline against a written spec
    judged: 2026-09-26

  - job: weekly-review
    tier: large
    consumer: the weekly planning agent
    why: the output is the product, and a weak attempt is wasted
    judged: 2026-09-26
```

```bash
MODEL="$(model-for.sh headline-judge small)"   # job, then fallback
```

## When to move up a tier

- The same task failed twice at the current tier.
- A wrong answer is costly: data loss, security, money, or a message sent to other people.
- The task is itself a design trade-off.
- The person asking says it matters.

When one of these is true, move up at once. Do not keep trying at the cheap tier.

## Should

- Send mechanical bulk work down a tier: file sweeps, format conversion, and classification of single items.
- Say so when work ran on a tier other than the default, with one line of reason.
- Never lower quality without saying so. If a cheap answer is uncertain and the stakes are real, move up, or state that a stronger model would do better.
- Measure the fixed cost of the top tier. In one measurement about 27,000 cached tokens came with every call, so a two-word question cost about a quarter of a dollar. That figure is from one account on one date. Measure your own.
- Give the registry a `--check` mode that validates tier names and date formats.

## Gotchas

- An environment override for one-off tests is useful. Make sure it cannot be left set.
- A free or cheap first choice with a paid fallback can fail without a sign. One primary model was retired, every call fell back, and nobody noticed for three weeks. Log which model answered, and watch for the fallback firing on every run.
- A settings key that names a model which no longer exists is silently ignored.

## Validation checklist

- A search of the scripts finds no model name outside the registry and the fallbacks.
- Every unattended launcher passes an explicit model.
- Every registry entry has a reason and a date.
- The logs say which model answered each job.

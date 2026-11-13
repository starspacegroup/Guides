---
title: Cron on Pages: A Scheduler Worker and a Claim in SQL
excerpt: Pages has no Cron Triggers. Run a small Worker that calls authenticated routes, claim each run in one SQL statement, and test that the pieces agree.
difficulty: advanced
tags: Cloudflare, Workers, Deployment, Database
---

## Rule

Schedules live in a separate Worker whose only job is to POST to authenticated routes on the Pages app. Each run is claimed in the database with one conditional statement, so a retry or a duplicate tick cannot run a job twice.

## Why

A Pages project cannot have a `scheduled()` handler. The usual workarounds are a CI job that calls a URL on a timer, which puts a production secret in a third-party account, or a process on someone's machine, which is a single point of failure. A Worker with a Cron Trigger is the platform's own answer, and it needs no bindings at all.

```
Cron Trigger -> scheduler Worker -- POST + Bearer CRON_SECRET --> /api/cron/<job> (Pages)
```

## Must

- Give the Worker no bindings, no route, and no `fetch` handler. It only calls out.
- Authenticate each call with a bearer secret, compared in constant time. Return 503 when the secret is not configured, so the caller retries and the route is never open.
- Send the scheduled time in a header, so every retry of one tick claims the same slot.
- Claim the run with one statement, keyed on job, trigger, and slot.
- Let a new run take over only from a failed run, a timed-out run, or an expired lease.
- Give the lease a length greater than the job timeout.
- Retry 5xx, 408, 429, and network errors a few times with a growing delay. Never retry other 4xx responses.

## Pattern

```sql
INSERT INTO scheduled_job_runs (id, job_id, trigger, slot, status, lease_until, attempts)
VALUES (?1, ?2, ?3, ?4, 'running', ?6, 1)
ON CONFLICT (job_id, trigger, slot) DO UPDATE SET
  id = excluded.id,
  status = 'running',
  lease_until = excluded.lease_until,
  attempts = scheduled_job_runs.attempts + 1
WHERE scheduled_job_runs.status <> 'succeeded'
  AND (scheduled_job_runs.status <> 'running' OR scheduled_job_runs.lease_until <= ?5)
RETURNING id;
```

No returned row means another run holds the slot. The takeover replaces the run id, and every later write names that id, so a stale run cannot overwrite the run that replaced it.

## Should

- Keep a registry of jobs in code, and write a test that reads the registry, the Worker's cron expressions, and the route files, then fails when any one is missing from the others.
- Use status codes the caller can act on: 200 for done or already done, 500 for failed, 504 for timed out.
- Prune run history in bounded batches. See the guide on write budgets.
- Keep the job logic in the app, where it has the bindings. The Worker stays a timer.

## Gotchas

- If your adapter generates the Worker entry file, a hand-written wrapper is overwritten on build, with no error and no `scheduled()` export. Check the deployed Worker for the handler.
- Cron Triggers use UTC.
- Queue consumers have the same limit on Pages. They also need a Worker, and each consumer needs a dead-letter queue that exists before the deploy.

## Validation checklist

- Calling a cron route with no secret returns 401, and with the secret unset returns 503.
- Calling the same slot twice runs the job once.
- A run that is killed mid-job is picked up after its lease expires.
- The drift test fails when a job is added to the registry only.

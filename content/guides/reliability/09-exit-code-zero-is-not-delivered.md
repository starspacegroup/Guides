---
title: Exit Code Zero Is Not "Delivered"
excerpt: curl exits 0 on a 403, and a pipeline reports the status of its last command. Mark work as done only inside a branch that checked the real result.
difficulty: intermediate
tags: Shell, Scripts, Reliability, Automation
---

## Rule

A script records success only after it has checked the thing that matters: the HTTP status, the file on disk, the row in the table. The script's own exit code reports failure.

## Why

Fifteen notification scripts logged `PUSHED` after calling `curl -s`. `curl` exits 0 whenever it gets an HTTP response, and that includes 401, 403, 429, and 500. The log said every message was delivered while the service was rejecting them.

Three consequences were worse than a wrong log line. A ledger marked the rejected items as sent, so they were suppressed for three days. A one-time reminder was retired without ever being shown. A security alert ended in `|| true`, so its failure could not be seen at all.

An installer made the same mistake in another form. It ran `install.sh | tee log`, read the exit status of `tee`, and printed "install returned 0" under a Python traceback.

## Must

- Check the HTTP status, not only the exit code. Use `curl --fail-with-body`, or capture the code with `-w '%{http_code}'`.
- Write the "done" marker, ledger line, or flag only inside the success branch.
- Exit non-zero when the delivery failed, so the service manager shows the unit as failed.
- Read `${PIPESTATUS[0]}` for the left side of a pipeline, or set `pipefail`.
- Put sending in one shared helper. It returns 0 only on 2xx, retries 429 and 5xx, and never retries other 4xx.
- When the alert channel itself fails, write the failure to a local log that something else reads.

## Pattern

```bash
post_failed=0
if notify_post "$CHANNEL" "$BODY"; then
  runlog "PUSHED $ITEM_ID"
  echo "$ITEM_ID" >> "$LEDGER"   # only after a real 2xx
else
  runlog "push FAILED: $NOTIFY_ERR"
  post_failed=1
fi
exit "$post_failed"
```

```bash
set -o pipefail
./install.sh 2>&1 | tee install.log
status=${PIPESTATUS[0]}
```

## Should

- Verify the artifact, not the report. After an upgrade, check that the new version is the one running. One updater rebuilt the old files and printed "switched".
- Write a regression test for each fix, and show that it fails on the old behaviour before you trust it.
- Give the helper a base URL override, so tests post to a local stub.
- Log which path answered when there is a fallback. A fallback that always works hid a dead primary for three weeks.

## Gotchas

- `set -e` does not stop the script for a failure inside `$(...)` in many positions, after `||`, or in a `while` condition.
- `OUT=$(f)` runs `f` in a subshell. Variables that `f` sets, such as an error message, are lost. Return data in a named variable instead.
- A `grep` that finds nothing exits 1. Under `set -e` that ends the script with no message.
- `|| true` on the last line of defence removes the defence.

## Validation checklist

- Pointing the script at a stub that returns 403 produces a FAILED log line and a non-zero exit.
- Nothing is written to the ledger on failure.
- The service manager lists the unit as failed after a rejected delivery.
- An installer that throws part way through reports a failure.

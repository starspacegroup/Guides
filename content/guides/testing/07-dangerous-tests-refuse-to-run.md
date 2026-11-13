---
title: Dangerous Tests Must Refuse to Run
excerpt: A test that types keys, deletes files or writes to a real state file checks where it is first, and stops with a clear message if the place is not disposable.
difficulty: intermediate
tags: Testing, Safety, Automation
---

## Rule

A test with real side effects starts with a guard. The guard asserts that the environment is isolated, and it refuses to continue if it is not.

## Why

An end-to-end test for a keyboard remapper created a virtual keyboard and sent every key code from 1 to 255. It was run on a developer's live desktop. The keys went into whatever windows were open, and the session had to be restarted.

In another project a test wrote to the real orchestration state file. A file of 2,142 lines became 25 lines, and nothing ran for five hours.

Neither test had a bug in its logic. Each was correct, and aimed at the wrong target.

## Must

- Detect a live environment, and stop. Look for a display server, a session socket, or a production hostname.
- Require an explicit opt-in variable in addition to the detection. Both must agree.
- Point every path at a temporary directory. A test must have no way to reach the real file.
- Make the refusal message say what the test would have done, and where to run it.
- Run such tests only in a virtual machine or a container.

## Pattern

```rust
fn isolation_guard() {
    let desktop = ["WAYLAND_DISPLAY", "DISPLAY", "HYPRLAND_INSTANCE_SIGNATURE"]
        .iter()
        .any(|name| std::env::var_os(name).is_some());
    assert!(
        !desktop,
        "refusing: a desktop session is live, and this test's virtual keyboard would type into it. \
         Run only in an isolated VM or headless box with E2E_ISOLATED=1."
    );
    assert_eq!(
        std::env::var("E2E_ISOLATED").as_deref(),
        Ok("1"),
        "refusing: set E2E_ISOLATED=1 inside the test VM"
    );
}
```

For state files, take the path from the environment, and refuse the default in tests:

```ts
const statePath = process.env.APP_STATE_FILE;
if (!statePath || !statePath.startsWith(tmpdir())) {
	throw new Error('refusing: tests need APP_STATE_FILE under the temp directory');
}
```

## Should

- Give risky features a trial mode that releases itself, such as `--trial 30`, which gives the keyboard back after thirty seconds whatever happens.
- Make the panic path and the watchdog release resources through the simplest route available. Use no locks and no allocation.
- Record a process's start time together with its id. A process id alone can be reused by another process.
- Make shared-state writes compare-and-set. Three writers that each saved their own copy once removed an entry with no error, and it took six days to notice.
- Redirect test logs away from the real audit log. A test that writes to the real one pollutes the record, and can trip real alarms.

## Gotchas

- "It only runs in CI" is not a guard. Someone will run the whole suite locally.
- A guard that checks only the opt-in variable fails when the variable is exported in a shell profile.
- Tests for destructive commands should assert on a dry-run plan where possible, and execute only inside the sandbox.
- A daemon whose supervisor thread has died may keep serving while doing no work. Make it exit non-zero, so the fault is visible.

## Validation checklist

- Running the suite on a desktop session skips or refuses the dangerous tests with a clear message.
- No test can write outside a temporary directory, even with a wrong configuration.
- The trial mode releases by itself when the process is killed.
- The guard has a test of its own.

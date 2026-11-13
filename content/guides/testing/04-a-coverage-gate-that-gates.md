---
title: A Coverage Gate That Actually Gates
excerpt: A threshold written in the docs and not in the config protects nothing. Put the floor in the test tool, run that exact command in CI, and delete checks that cannot fail.
difficulty: beginner
tags: Testing, Coverage, CI
---

## Rule

The coverage floor lives in the test runner's configuration. CI runs the same command a developer runs. A check that cannot fail is removed.

## Why

One project's docs promised 95% coverage. The config said 90%. Coverage slid to 94.28% and nothing failed, because the number in the docs was only prose.

The same project had a second CI step that read a coverage summary file with `jq` and compared it with a threshold. Nothing produced that file. The step ended in a pipe that hid the error status, so it had passed on every run since it was written. It looked like a gate, and it gated nothing.

## Must

- Set thresholds for lines, functions, branches, and statements in the runner config.
- Run that command in CI with no extra flags that change what it measures.
- List what is excluded and why, in a comment next to the exclusion.
- Raise the floor when coverage rises. Never lower it to make a change pass.
- Prove each CI check can fail. Break it on purpose once, and watch it go red.

## Pattern

```ts
// vite.config.ts
export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			exclude: [
				'tests/',
				'**/*.d.ts',
				'scripts/',
				// Components are covered by browser tests, not by unit branches.
				'**/*.svelte'
			],
			thresholds: {
				lines: 95,
				functions: 95,
				branches: 95,
				statements: 95
			}
		}
	}
});
```

## Order the pipeline by cost

1. Structural checks: migration names, binding ids, lockfile.
2. Type check.
3. Static validators, such as theme contrast.
4. Build.
5. Unit tests with coverage.
6. Browser tests, in a separate job.

A cheap check that fails in ten seconds saves the ten minutes behind it.

## Should

- Say in the docs which convenience commands are not the CI gate. A `validate` script that skips coverage will be mistaken for the real thing.
- Pin the package manager version in CI, and install with a frozen lockfile.
- Keep one lockfile. Two lockfiles drift apart.
- Regenerate the lockfile only with a released version of the package manager. A pre-release build once wrote a lockfile format that no released version could read, and every install failed.
- Never report a gate as passing unless you watched the run.

## Gotchas

- Branch coverage is the number that drops first, and the one that finds real gaps. Do not leave it out.
- Tests written to touch lines and assert nothing raise the number, and protect nothing. Review tests for assertions.
- `set -o pipefail` is off by default in many CI shells. A failing command on the left of a pipe passes.
- An upload step for coverage reports should not fail the build when the reporting service is down. The threshold already did the gating.

## Validation checklist

- Deleting one test makes the coverage command fail locally and in CI.
- The threshold in the docs matches the config, and the docs point at the config.
- Every CI step has been seen red at least once.
- The CI log shows the same command a developer runs.

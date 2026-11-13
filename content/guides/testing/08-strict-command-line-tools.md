---
title: Strict Command-Line Tools
excerpt: A command with one bad argument changes nothing and says why. Validate everything before acting, and report a refusal as a refusal, not as silence.
difficulty: beginner
tags: CLI, Validation, Testing
---

## Rule

A command-line tool validates every argument and every setting before it does anything. If one value is bad, the tool changes nothing, prints a usage error, and exits non-zero.

## Why

Lenient tools turn typing mistakes into actions. A stray word after `stop` was ignored, so `stop now please` and `stop` did the same thing, and so did a mistyped subcommand. A port setting that was not a number was read as zero, and the tool reported "server is down". The server was fine. The setting was wrong. A command with two values, one good and one bad, applied the good one and then failed, leaving half a change behind.

Each of these was found by a test, and each fix was small.

## Must

- Reject unknown arguments and extra words. Do not ignore them.
- Parse all values first, then act. Never apply one value before the next has been checked.
- Tell a configuration error apart from a runtime failure. "PORT is not a number" is a usage error. "Server is down" is not.
- Exit with a non-zero status for every failure. A common convention is 2 for usage errors and 1 for runtime failures.
- When the server refuses a request, print the refusal. Do not print "ok".
- Report an unreadable state file by its path and the reason. Never print a stack trace as the user-facing message.

## Pattern

```ts
type Parsed = { ok: true; command: Command } | { ok: false; message: string };

export function parseArgs(argv: string[], env: Record<string, string | undefined>): Parsed {
	const [name, ...rest] = argv;

	const portText = env.APP_PORT ?? '4330';
	if (!/^\d+$/.test(portText) || Number(portText) > 65535) {
		return { ok: false, message: `APP_PORT must be a port number, got "${portText}"` };
	}

	if (name === 'stop') {
		if (rest.length)
			return { ok: false, message: `stop takes no arguments, got "${rest.join(' ')}"` };
		return { ok: true, command: { kind: 'stop', port: Number(portText) } };
	}

	if (name === 'seek') {
		const seconds = Number(rest[0]);
		if (rest.length !== 1 || !Number.isFinite(seconds) || seconds < 0) {
			return { ok: false, message: 'usage: seek <seconds>' };
		}
		return { ok: true, command: { kind: 'seek', seconds, port: Number(portText) } };
	}

	return { ok: false, message: `unknown command "${name ?? ''}"` };
}
```

The parser is pure, so every bad input is a one-line test.

## Should

- Write one test file for each kind of bad input. They are quick to write, and each one pins a past bug.
- Print errors to standard error and results to standard output.
- Make `--help` and a bare invocation print usage and exit 0.
- Check types strictly. `Number('')` and `Number(null)` are both 0.
- Offer `--dry-run` for commands that change things.

## Gotchas

- An argument library that allows unknown flags by default will hide typos. Turn on strict mode.
- "Did nothing" and "did it" must look different. A command that prints nothing in both cases cannot be scripted.
- Error messages that echo input should quote it, so an empty or whitespace value is visible.

## Validation checklist

- `tool stop extra` exits 2 and stops nothing.
- A non-numeric port produces a usage error that names the variable.
- A command with one valid and one invalid value changes nothing.
- A refused request prints the reason and exits non-zero.

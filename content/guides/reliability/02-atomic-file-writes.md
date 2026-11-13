---
title: Atomic File Writes
excerpt: Write to a temporary file beside the target and rename it into place. A reader then sees the whole old file or the whole new one, never half of either.
difficulty: beginner
tags: Files, Caching, Reliability
---

## Rule

Never write a file that others read in place. Write a temporary file in the same directory, then rename it over the target.

## Why

A write is not instant. A process that reads a cache file while another process is half way through writing it gets a truncated file. If that file is JSON, the parse fails. The reader then decides the cache is corrupt and starts again from nothing, or crashes. A power cut or a kill signal during the write leaves the same half file behind for good.

A rename within one file system is atomic. The name points at the old content until the moment it points at the new content.

## Must

- Create the temporary file in the same directory as the target. A rename across file systems is a copy, and a copy is not atomic.
- Remove the temporary file if the write or the rename fails.
- Serialise writers for each path. Two concurrent read-modify-write cycles lose one of the updates.
- Treat an unreadable file as an error to report. Do not treat it as an empty file to overwrite.

## Pattern

```ts
import { rename, rm } from 'node:fs/promises';

export async function writeAtomic(path: string, text: string): Promise<void> {
	const tmp = `${path}.${process.pid}.tmp`;
	try {
		await Bun.write(tmp, text);
		await rename(tmp, path);
	} catch (cause) {
		await rm(tmp, { force: true }).catch(() => {});
		throw cause;
	}
}

const queues = new Map<string, Promise<unknown>>();

export function serialised<T>(path: string, task: () => Promise<T>): Promise<T> {
	const next = (queues.get(path) ?? Promise.resolve()).then(task, task);
	queues.set(
		path,
		next.catch(() => {})
	);
	return next;
}
```

## Should

- Include the process id or a random suffix in the temporary name, so two processes do not share one temporary file.
- Call `fsync` on the file before the rename when the data must survive a power cut. The rename orders the names, and `fsync` puts the bytes on disk.
- For a long recording, keep the file valid as it grows. One recorder rewrites the WAV header every second, so a crash leaves a playable file.
- Keep generated files and user-edited files apart. Regenerate the first kind freely. Write the second kind once, and never overwrite it on a later run.

## Gotchas

- "Set one flag" must not become "replace the whole file with one flag". If the read fails, stop. A setting changed while the file was unreadable once wiped every other setting.
- Leftover temporary files after a crash are harmless, and they add up. Clear old ones at start.
- An installer that rewrites a user's config from a template on every run destroys their edits. Check whether the file exists first.

## Validation checklist

- Killing the process during a write leaves the old file complete and readable.
- A reader in a tight loop never sees a parse error while a writer runs.
- Two concurrent updates to different keys both appear in the final file.
- No temporary files remain after a failed write.

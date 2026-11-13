---
title: Keep Slash Commands in Sync by Hash
excerpt: Nobody should have to remember a register-commands step. Build each server's command list from one function, hash it, and sync when the hash changes.
difficulty: intermediate
tags: Discord, Bots, Deployment
---

## Rule

One function builds the command list for a server. A recurring job hashes that list, compares the hash with the one stored at the last sync, and sends the list to Discord only when the two differ.

## Why

A manual `register-commands` script works until someone forgets it. A dashboard showed a new `/play` command as enabled. Discord had never been told about it. The interface and the platform disagreed, and users saw a command in the docs that was missing from the picker.

A related fault came from having two sources. A preset named an operation that was missing from the registry, so every run of it failed with "unknown operation", while the dashboard showed it as available.

## Must

- Build the list with one function that both the dashboard and the sync call.
- Serialise the list in a stable order before you hash it.
- Store the hash for each server after a successful sync.
- Sync when the hash differs, or when no hash is stored.
- Back off after a failure. Thirty minutes is reasonable, because command registration has strict rate limits.
- Run a sync right after a deploy as well, and wait until the new code is really serving first.
- Write a test that fails when a preset or a config names a command or an operation that is not registered.

## Pattern

```ts
export async function syncGuildCommands(guildId: string, env: Env): Promise<SyncResult> {
	const commands = buildGuildCommands(await loadGuildConfig(guildId, env));
	const payloadHash = await sha256(stableStringify(commands));

	const stored = await env.DB.prepare(
		'SELECT payload_hash, retry_after FROM guild_command_sync WHERE guild_id = ?'
	)
		.bind(guildId)
		.first<{ payload_hash: string | null; retry_after: string | null }>();

	if (stored?.retry_after && new Date(stored.retry_after) > new Date()) return 'backing-off';
	if (stored?.payload_hash === payloadHash) return 'unchanged';

	const response = await putGuildCommands(guildId, commands, env);
	if (!response.ok) {
		await recordFailure(guildId, env, 30 * 60);
		return 'failed';
	}
	await recordSuccess(guildId, payloadHash, env);
	return 'synced';
}
```

## Should

- Use the bulk overwrite endpoint for each server. It replaces the whole list in one call, so removed commands disappear.
- Prefer server-scoped commands while you iterate. They update at once.
- After a deploy, poll a version endpoint until it reports the new commit, then sync. Platforms that deploy from their own git integration finish after your CI job does.
- Record the time of the last check as well as the last sync. "Never ran" and "ran, nothing to do" should look different.
- Show the sync state in the dashboard: in sync, pending, or failed, with the reason.

## Gotchas

- Key order changes the hash. Sort keys, or use a stable stringify.
- Discord normalises some fields in what it stores. Hash what you send, not what the API returns.
- A server that removed the bot returns 403 for ever. Stop trying after a few failures, and mark the server inactive.
- A job that runs every minute over thousands of servers must read hashes in batches, or the check itself becomes the load.

## Validation checklist

- Enabling a command in the dashboard makes it appear in Discord within the job's interval, with no manual step.
- A second run with no change makes no API call.
- A failed sync is retried after the back-off, and not before.
- The registry test fails when a preset names something unknown.

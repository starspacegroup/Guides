---
title: Snapshot Your Discord Server Into Git
excerpt: Discord has no undo. An hourly script that writes roles, channels and permissions to sorted YAML in a git repository gives you history, blame and a rebuild plan.
difficulty: intermediate
tags: Discord, Backups, Automation
---

## Rule

Back up the structure of a Discord server as sorted, diff-friendly text in git. Log each change with who made it. Restore by hand, after review, and never automatically.

## Why

A deleted channel takes its permission overwrites with it. A mistaken role edit can expose a private category, and nothing in Discord shows what the setting was before. The audit log helps, and it keeps only 45 days.

A snapshot in git answers three questions the platform cannot: what did this look like last month, what changed on Tuesday, and what exactly has to be rebuilt.

## Must

- Capture server settings, roles, categories, channels, permission overwrites, emoji, and automod rules.
- Sort every list by id, and write keys in a fixed order. A diff then shows only real changes.
- Leave out values that change by themselves: invite use counts, member counts, and presence.
- Store counts for each role, never member ids or names.
- Never store webhook URLs or tokens. A webhook URL is a credential.
- Store no message content.
- Read the audit log on each run, and attach the actor to each change in a changelog file.
- Commit only when something changed.

## Pattern

```ts
// Privacy: no member names or ids (counts for each role only), no message
// content, no webhook tokens or URLs.
const snapshot = {
	guild: pick(guild, [
		'name',
		'verification_level',
		'explicit_content_filter',
		'system_channel_id'
	]),
	roles: roles.sort(byId).map((role) => ({
		id: role.id,
		name: role.name,
		position: role.position,
		permissions: role.permissions,
		members: memberCountByRole.get(role.id) ?? 0
	})),
	channels: channels.sort(byId).map((channel) => ({
		id: channel.id,
		name: channel.name,
		type: channel.type,
		parent_id: channel.parent_id,
		overwrites: channel.permission_overwrites.sort(byId)
	}))
};

await writeAtomic('server-state/snapshot.yaml', stringify(snapshot));
```

## Rebuild order

When you restore by hand, dependencies set the order:

1. server settings
2. roles
3. categories
4. channels
5. permission overwrites
6. emoji, stickers, and the rest

## Should

- Run the script hourly from a timer, with a read-only bot token where the API allows it.
- Keep the token out of the repository.
- Write a short human-readable changelog next to the snapshot: the date, the actor, and what changed.
- Run silently. The backup should post nothing to the server.
- Practise a rebuild on a test server once.

## Gotchas

- A recreated role or channel gets a new id. Everything that stored the old id must be pointed at the new one: bot configuration, automod exemptions, and channel links in messages.
- An hourly run can miss the actor when many edits land in one hour. The snapshot is still right, and the attribution is best effort.
- A colon followed by a space inside an unquoted YAML string breaks the parse. Quote strings that came from users.
- One YAML parser misread a large file and returned 6 of 241 records with no error. After you parse, check the count against a known total.
- If a permission overwrite targets one member, that member's id is in the data. Decide whether to keep it or mask it.

## Validation checklist

- Two runs with no server change produce no commit.
- Renaming a channel produces a one-line diff and a changelog entry with the actor.
- The repository contains no webhook URL, token, or member list.
- The snapshot is enough to rebuild a role's permissions by hand.

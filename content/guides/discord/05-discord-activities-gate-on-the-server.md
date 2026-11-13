---
title: Discord Activities: Check Membership on Your Server
excerpt: An Activity runs in an iframe, and the server and channel ids it reports are claims. Decide access from your own member and voice-state lookup, on every call.
difficulty: advanced
tags: Discord, Activities, Authorization, Security
---

## Rule

The ids that the embedded SDK hands to an Activity are untrusted input. Your backend looks up the member and their voice state itself, and it checks again on every request.

## Why

A Discord Activity is a web page in an iframe inside the client. It learns its server id and channel id from the SDK in the browser. Anyone who controls the browser can change what the page sends to your backend. If the backend trusts those values, a person who is not in the server, or not in the voice channel, can join the Activity and read whatever it shows.

The iframe sits in a third-party context, so cookies are unreliable there too. A session has to travel another way.

## Must

- Exchange the OAuth code on your server, and learn the user's id from Discord. Do not learn it from the page.
- Look up membership and voice state from your bot's own view of the server.
- Allow access only when the user is a member, and is in the voice channel that the Activity claims.
- Issue your own session token, signed with HMAC, bound to the user and the channel, with a lifetime of a few hours.
- Send the token in a header. Do not depend on cookies.
- Check again on a short interval, and before each sensitive action. People leave channels.
- Check control actions, such as skip, mute, and kick, against a fresh role lookup.
- Log every control attempt.

## Pattern

```ts
type Member = { inGuild: boolean; voiceChannelId: string | null };

export function activityGate(
	member: Member,
	guildId: string | null | undefined,
	channelId: string | null | undefined
): { ok: true } | { ok: false; reason: string } {
	if (guildId !== HOME_GUILD_ID) return { ok: false, reason: 'not this server' };
	if (!channelId) return { ok: false, reason: 'no channel' };
	if (!member.inGuild) return { ok: false, reason: 'not a member' };
	if (member.voiceChannelId !== channelId) {
		return {
			ok: false,
			reason: member.voiceChannelId ? 'a different voice channel' : 'not in voice'
		};
	}
	return { ok: true };
}
```

`member` comes from your backend's lookup. `guildId` and `channelId` come from the page, and they are only compared with what the backend already knows.

The gate is a pure function. It has unit tests, and it takes no part in fetching.

## Should

- Check again about every five seconds while the Activity is open, and end the session when the gate fails.
- Point the public tunnel at the filtered backend. Never point it at an internal service that has wider access.
- Use the SDK's ids for display and routing only.
- Keep the token lifetime short enough that a leaked token matters little.

## Gotchas

- The OAuth redirect list needs an entry even though the embedded flow never visits it. A loopback placeholder satisfies the form.
- The bot needs the server members intent, and the voice states intent, to answer the lookup. If either is turned off, every gate check fails closed, which looks like a bug.
- The Activity is served through Discord's proxy, so your Content Security Policy and URL mappings must account for that.
- Caching the role lookup for control actions lets a demoted moderator keep control for the cache lifetime.

## Validation checklist

- A request with a forged channel id is refused.
- A user who leaves the voice channel loses access within the re-check interval.
- A non-moderator cannot use a control action by calling the API directly.
- The Activity works with third-party cookies blocked.

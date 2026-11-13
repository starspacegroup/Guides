---
title: A Bot Must Ignore Its Own Messages
excerpt: Any rule of the form "when a message appears, post a message" can trigger itself. Skip the bot's own events by default, and make including them a visible choice.
difficulty: beginner
tags: Discord, Bots, Automation
---

## Rule

Automation ignores events that the bot itself caused. Reacting to the bot's own messages is an explicit setting on a rule, and it is off unless someone turns it on.

## Why

A bot's own posts arrive from the gateway as ordinary `MESSAGE_CREATE` events. An automation that says "when a message in this channel contains a link, post a summary" sees its own summary, which may contain a link, and posts another. With no guard and no cooldown, that is a loop that runs until Discord rate-limits the bot, or a person notices.

The loop needs no bug in the rule. The rule did what it said.

## Must

- Reject the bot's own events first in the matcher, before any other filter runs.
- Make "include my own messages" a named option on a rule, off by default.
- Mark each event with whether the bot produced it when you log it. The matcher then needs no extra lookup.
- Ignore other bots by default too, with a separate option.
- Send each message with a nonce, so a retried request does not post twice.

## Pattern

```ts
export function matches(automation: Automation, event: GatewayEvent): boolean {
	const filters = automation.filters;

	// Loop guard first. An automation sees the bot's own posts only when its
	// author asked for that.
	if (event?.details?.isOwnBot === true && filters?.own_bot_messages !== 'include') {
		return false;
	}
	if (event?.details?.isBot === true && filters?.other_bots !== 'include') {
		return false;
	}

	return matchesChannel(filters, event) && matchesContent(filters, event);
}
```

## What the guard does not cover

- **Two automations that trigger each other.** A posts in a channel B watches, and B posts in a channel A watches. Each ignores itself, and neither ignores the other, because both are the same bot. Count the depth of a chain, and stop at a small number.
- **A loop through another bot.** Your bot reacts to a second bot, which reacts to yours. A rate limit for each channel is the backstop.
- **Edits.** An automation that edits a message, and also triggers on edits, loops in the same way.

## Should

- Carry a chain id and a depth on events the bot produces, and refuse to act past a depth of two or three.
- Add a cooldown for each rule and channel as a second line of defence. It is not the first line.
- Show a warning in the rule editor when "include my own messages" is on.
- Log a line each time the guard skips an event, at a low log level.

## Gotchas

- Adding the guard changes behaviour for anyone who relied on the bot reacting to itself, such as a rule that pins its own announcements. Announce the change, and give those rules the opt-in.
- A webhook the bot posts through has a different author id from the bot user. Record the webhook ids you own, and treat them as yourself.
- Checking the author id in every handler is easy to forget in the next handler. Put the check in the one place every event passes through.
- A cooldown alone hides the loop. It slows the loop and does not stop it.

## Validation checklist

- A rule "on any message, reply" posts one reply to a person, and none to itself.
- Turning on the opt-in makes the same rule reply to itself, and the chain depth stops it.
- A retried send does not produce a duplicate message.
- Messages sent through the bot's own webhooks are treated as its own.

---
title: Authorize AI Tool Calls on the Server
excerpt: The user writes the prompt and the model picks the arguments, so every id in a tool call is attacker-controlled. Check each call against a context the server built.
difficulty: advanced
tags: AI, Authorization, Security
---

## Rule

A tool call from a model is checked like a request from a browser. The server compares its arguments with what the signed-in user may touch, and the system prompt is never the fence.

## Why

A chat assistant could manage several communities. The system prompt told the model which communities the user administered, and the tools accepted a community id as an argument. A security review pointed out the gap: the prompt was the only control. A user could type "use community 123" for a community they did not manage, the model would pass the id along, and the tool would run.

A model's output is shaped by text the user wrote. Arguments it produces deserve the same trust as a form field.

## Must

- Build an authorization context on the server from the session: who the user is and which resources they manage.
- Check every tool call against that context in the function that executes tools, before any tool code runs.
- Pin account-level tools to the session user. Ignore any user id in the arguments.
- Verify relationships between arguments. A channel id must belong to the community id in the same call.
- Mark tools that only an operator may use, and enforce that in code.
- Enforce preconditions in the executor too. If a tool needs a known time zone, refuse without one there.
- Return a refusal the model can read and relay. Do not throw an opaque error.

## Pattern

```ts
type ToolContext = {
	userId: string;
	isOperator: boolean;
	managedGuildIds: Set<string>;
	channelGuild: (channelId: string) => Promise<string | null>;
};

export async function authorizeToolCall(
	tool: ToolDefinition,
	args: Record<string, unknown>,
	context: ToolContext
): Promise<{ ok: true } | { ok: false; reason: string }> {
	if (tool.scope === 'account') return { ok: true }; // the executor pins these to context.userId
	if (tool.scope === 'operator') {
		return context.isOperator ? { ok: true } : { ok: false, reason: 'operator only' };
	}

	const guildId = typeof args.guildId === 'string' ? args.guildId : '';
	if (!context.managedGuildIds.has(guildId)) {
		return { ok: false, reason: 'you do not manage that server' };
	}

	if (typeof args.channelId === 'string') {
		if ((await context.channelGuild(args.channelId)) !== guildId) {
			return { ok: false, reason: 'that channel is not in that server' };
		}
	}
	return { ok: true };
}
```

## Should

- Default new tools to the most restrictive scope. A tool with no declared scope is refused.
- Log each tool call with the user, the tool, the arguments, and the decision.
- Make destructive tools two-step. The first call returns "confirmation needed" with a summary, and the second call carries `confirm: true`. The server checks who is confirming.
- Give the model the list of resources the user manages as help. It reduces wrong guesses, and it is not the control.
- Guard form actions and API routes with the same checks. Page loaders that checked access, beside actions that did not, are a common gap.

## Gotchas

- Text returned by a tool, such as a web page or a chat message, can contain instructions. The model may act on them. Authorization on every call is what limits the damage.
- An id that looks valid can still be guessed. Check membership, not format.
- Caching the authorization context across requests brings back stale privileges. Build it for each request.

## Validation checklist

- A prompt that names a resource the user does not manage produces a refusal, and no tool runs.
- A channel from one community with another community's id is refused.
- An account tool called with another user's id acts on the caller only.
- A tool with no declared scope cannot be called.

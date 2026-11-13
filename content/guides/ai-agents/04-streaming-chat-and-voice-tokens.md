---
title: Streaming Chat and Voice Without Leaking the Key
excerpt: The provider key stays on the server. Chat streams through your own endpoint with an allow-list of models, and voice gets a short-lived token made for one session.
difficulty: intermediate
tags: AI, Streaming, Security
---

## Rule

The browser never holds the provider's API key. Chat requests go through a server route that authenticates the user and checks the model against an allow-list. Realtime voice uses an ephemeral token that the server creates for each session.

## Why

A key in client code belongs to anyone who opens the developer tools. A server route that forwards whatever model name it receives lets a user pick the most expensive model on your account. Voice is the hard case, because the browser must connect to the provider directly to keep latency low. The answer is a token that expires in about a minute and works for one session.

## Must

- Require a signed-in user on every chat and voice route.
- Keep a list of permitted models on the server. Return 400 for anything else.
- Return 503 when no provider key is configured, and 403 when a feature such as voice is switched off.
- Stream with Server-Sent Events, and end the stream with an explicit terminator.
- For voice, call the provider's session endpoint from the server, and return only the ephemeral secret.
- Validate the provider's response before you use it.
- In admin screens, show a key only as "configured" plus its last four characters.

## Pattern

The stream route:

```ts
export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) throw error(401, 'Sign in to chat');

	const { model, messages } = await request.json();
	const allowed = await getConfiguredChatModels(platform);
	if (!allowed.includes(model)) throw error(400, 'Unknown model');

	const key = await getProviderKey(platform);
	if (!key) throw error(503, 'No AI provider is configured');

	const upstream = await callProvider(key, { model, messages, stream: true });
	return new Response(upstream.body, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-cache',
			'x-accel-buffering': 'no'
		}
	});
};
```

The voice token:

```ts
const data = await response.json();
if (!data.client_secret?.value) {
	console.error('Invalid response from the realtime sessions API: missing client_secret');
	throw new Error('Invalid response: missing client_secret');
}
return { token: data.client_secret.value };
```

## Should

- Compute cost for each message from a price table you maintain, and store it with the message.
- Cap the context you send, and tell the user when old turns are dropped. A silent cap reads as the model forgetting.
- Limit requests per user.
- Play voice audio through a queue, in order. Chunks played as they arrive overlap each other.
- Read model names from configuration. They go out of date quickly.

## Gotchas

- Proxies and tunnels buffer event streams unless they are told not to. If tokens arrive in one burst at the end, look for buffering first.
- A client that disconnects should cancel the upstream call. Pass the request's abort signal through, or you pay for output nobody reads.
- Logging the provider's full error object can write request content to your logs. Decide what to log.
- Audio format details, such as sample rate and encoding, must match on both ends, or you get noise and no error.

## Validation checklist

- The page's network traffic and scripts contain no provider key.
- A request for a model that is not on the list returns 400.
- A signed-out request returns 401.
- Text appears on screen in increments, not all at once.
- The voice token stops working after its expiry.

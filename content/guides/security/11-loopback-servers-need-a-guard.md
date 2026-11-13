---
title: A Localhost Server Still Needs a Guard
excerpt: Binding to 127.0.0.1 keeps other machines out. It does not keep out the web pages open in your own browser, which can post to localhost freely.
difficulty: intermediate
tags: Security, Local Apps, Authentication
---

## Rule

A local server checks the `Host` header on every request and the `Origin` header on every write. Binding to loopback is the first lock, not the only one.

## Why

Any web page you visit can send requests to `http://127.0.0.1:<port>`. Two attacks follow:

- **Cross-site requests.** A page can submit a form to your local server. A form post with `text/plain` needs no preflight, and a server that calls `request.json()` will parse it anyway.
- **DNS rebinding.** A page can point its own domain name at 127.0.0.1 after it loads. The browser then treats your local server as the page's own origin, and the page can read the answers.

A local tool that controls a mail client, a recorder, or a media player is worth attacking this way.

## Must

- Bind to `127.0.0.1` explicitly. Many servers default to all interfaces.
- Reject any request whose `Host` is not loopback with your port. This blocks rebinding, because the rebound request carries the attacker's host name.
- On every method except GET and HEAD, reject an `Origin` that is not your own.
- Never change state on a GET.
- Cap the request body. Local endpoints read a few dozen bytes.
- Accept a fixed list of actions. Validate each field's type before use.

## Pattern

```ts
const allowedHosts = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);

function guard(req: Request): Response | null {
	// Loopback only, and only when the Host is ours: blocks DNS rebinding.
	if (!allowedHosts.has(req.headers.get('host') ?? '')) return fail(403, 'Wrong host');

	if (req.method !== 'GET' && req.method !== 'HEAD') {
		const origin = req.headers.get('origin');
		if (origin && !allowedHosts.has(new URL(origin).host)) return fail(403, 'Wrong origin');
		if (req.headers.get('x-myapp') !== '1') return fail(403, 'Missing header');
	}
	return null;
}

Bun.serve({
	hostname: '127.0.0.1',
	port: PORT,
	maxRequestBodySize: 8 * 1024,
	fetch: (req) => guard(req) ?? route(req)
});
```

The custom header forces a preflight for cross-site callers, and the server never answers that preflight.

## Should

- Let requests with no `Origin` through, and say why in a comment. Command-line clients send none, and a browser always sends one on a cross-site write.
- When you publish the tool through a gate or a tunnel, have the gate authenticate and then rewrite `Host` to the loopback value. Never point a tunnel at the server directly.
- Keep any route that must work without sign-in, such as an emergency stop, off the public gate.
- Check types strictly. `Number(null)` is 0, and for a seek position 0 is a valid and wrong value.

## Gotchas

- Requests that arrive through a tunnel come from loopback. A server that trusts local addresses trusts everyone on the internet once a tunnel points at it.
- `localhost` can resolve to IPv6. Decide whether you listen on `::1` too, and list it.
- A permissive CORS header added during development is easy to leave in.

## Validation checklist

- `curl -H 'Host: evil.example' http://127.0.0.1:PORT/` returns 403.
- A POST with `Origin: https://evil.example` returns 403.
- The server does not answer on the machine's LAN address.
- A request body over the cap is refused.

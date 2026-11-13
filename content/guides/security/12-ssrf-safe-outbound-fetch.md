---
title: Fetch a User-Supplied URL Safely
excerpt: A URL that a user or tenant chose can point at your own network. Send it through one fetcher that checks the address at every redirect, with a timeout and a size cap.
difficulty: advanced
tags: Security, Networking, Webhooks
---

## Rule

Every request to a URL chosen by a user goes through one fetcher. The fetcher allows only public HTTP addresses, checks each redirect hop again, and always applies a timeout and a response size limit.

## Why

Webhook targets, avatar URLs, link previews, and import-from-URL features all make your server fetch an address that someone else picked. Without checks, that address can be `http://127.0.0.1`, a device on the local network, or a cloud metadata service that hands out credentials. This is server-side request forgery. A stored webhook URL makes it repeatable.

## Must

- Allow `http:` and `https:` only.
- Reject URLs that contain a username or password.
- Refuse loopback, private, link-local, carrier-grade NAT, and metadata address ranges, for IPv4 and IPv6.
- Parse the host as an address in every form a URL parser accepts, including decimal and hexadecimal. `http://2130706433/` is 127.0.0.1.
- Set `redirect: 'manual'`, follow at most a few hops yourself, and validate each hop.
- Apply a timeout and a maximum body size on every call.
- Accept only the content types the feature needs.

## Pattern

```ts
export async function safeFetch(input: string, options: SafeFetchOptions = {}): Promise<Response> {
	let url = assertPublicHttpUrl(input);

	for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
		const response = await fetch(url, {
			redirect: 'manual',
			signal: AbortSignal.timeout(options.timeoutMs ?? 8000),
			headers: options.headers
		});

		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get('location');
			if (!location) throw new Error('Redirect without a location');
			url = assertPublicHttpUrl(new URL(location, url).toString());
			continue;
		}
		return capBody(response, options.maxBytes ?? 1_000_000);
	}
	throw new Error('Too many redirects');
}
```

## Should

- Serve fetched content from your own origin with `X-Content-Type-Options: nosniff` and a sandboxing Content Security Policy.
- Show fetched SVG only through an `img` element, after an allow-list sanitiser. Inline SVG can run script.
- Validate the URL when it is saved and again each time it is used. The rules, and the DNS answer, can change in between.
- Send outbound webhooks from a network position that has no route to internal services, where your platform allows it.

## Gotchas

- **DNS rebinding remains.** A public host name can resolve to a private address at connect time. If the runtime gives no hook between resolution and connection, you cannot close this in code. Write the gap down, and limit what the fetcher's network can reach.
- An allow-list of host name suffixes is easy to get wrong. `example.com.evil.net` ends with nothing you trust, and it contains it.
- Error messages that include the fetched body turn a blind request into a readable one. Return a generic failure to the user.
- A timeout that covers only the connection lets a slow body hold the request open. Put the limit on the whole exchange.

## Validation checklist

- URLs for loopback, a private range, and the metadata address are refused, in dotted, decimal, and hexadecimal form.
- A public URL that redirects to a private address is refused at the second hop.
- A response larger than the cap is cut off with an error.
- A server that never answers causes a timeout error within the limit.

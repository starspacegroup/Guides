---
title: Agent-Ready Publishing That Stays Honest
excerpt: Serve robots.txt, a sitemap and Markdown versions of your pages for AI agents, and advertise only what really exists. A test fails when a public page is missing.
difficulty: intermediate
tags: AI, SEO, Content, Discovery
---

## Rule

Publish machine-readable discovery files as routes that build their URLs from the live request. Advertise only endpoints that exist. A test fails when a public route is not registered.

## Why

AI agents and crawlers read a site through `robots.txt`, a sitemap, and, more and more, a Markdown version of each page. A site that offers these is easier to cite correctly.

The risk is over-claiming. Discovery formats have fields for APIs, sign-in servers, and tool endpoints. A template that fills them all in describes services the site does not run. An agent that trusts the description fails, and the next reader trusts the site less. If your app signs people in through a provider, it is a client of that provider. Do not describe it as a sign-in server.

## Must

- Serve `robots.txt` and `sitemap.xml` from routes, not from static files. A route can build absolute URLs from the request origin, so they are right on localhost, on a preview address, and on the real domain.
- Keep one registry of public routes. The sitemap, the catalog, and the tests all read it.
- Fail a test when a route file exists that is neither registered nor explicitly excluded.
- Negotiate Markdown: when a request has `Accept: text/markdown`, return the page as Markdown.
- Send `Vary: Accept` on both the HTML and the Markdown response.
- List only APIs and capabilities that respond.
- Publish a security contact file only when a contact is configured.

## Pattern

```ts
export const agentDiscoveryHandler: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	if (!isConvertibleHtml(response)) return response;

	response.headers.set('Link', buildLinkHeader());
	response.headers.set('Vary', 'Accept');

	if (!prefersMarkdown(event.request.headers.get('accept'))) return response;

	try {
		const markdown = htmlToMarkdown(await response.clone().text());
		return new Response(markdown, {
			headers: {
				'content-type': 'text/markdown; charset=utf-8',
				'cache-control': 'private, no-store',
				vary: 'Accept'
			}
		});
	} catch {
		return response; // a conversion failure falls back to the HTML
	}
};
```

## Should

- Name the AI crawlers you allow or refuse in `robots.txt`, so the policy is a decision.
- Disallow platform paths, such as `/cdn-cgi/`.
- Let link-preview bots fetch share images, even where other paths are closed.
- State your content-use preferences, and change the default before you publish anything you would not want reused.
- End the sitemap's cache lifetime at the next scheduled publish time, so new pages appear on time.
- Place this hook before your page-view counter, so agent reads are counted.

## Gotchas

- Some edge caches ignore `Vary: Accept`. They would serve the Markdown to a browser, or the HTML to an agent. Mark the Markdown response `private, no-store`.
- A directory whose name starts with a dot may be skipped by your tooling. For a `.well-known` route folder, use the framework's escape for the dot.
- Staging and preview hosts need `noindex`, or they compete with the real site.
- Discovery files that list a page which returns 404 teach agents to distrust the list.

## Validation checklist

- `curl -H 'Accept: text/markdown' https://your.site/some-page` returns Markdown.
- The same URL with a browser `Accept` header returns HTML.
- The sitemap lists every public page, and no page that needs sign-in.
- Adding a public route with no registry entry fails the test suite.
- Every endpoint named in a discovery file responds.

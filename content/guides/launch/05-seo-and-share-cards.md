---
title: SEO and Share Cards: One Head Component per Page
excerpt: Each page sets its own title, description and share image through one component. Layouts and the HTML template set none, because the first tag a scraper finds wins.
difficulty: intermediate
tags: SEO, Content, Sharing
---

## Rule

Every page renders exactly one head component with its own title, description, and share image. Nothing social lives in the layout or in the HTML template. Structured data is generated from the same array that renders the visible text.

## Why

A scraper reads the first `og:title` it finds, and it stops. If a layout sets a default title and the page sets a specific one, both land in the head, and the layout's comes first. Every page on the site then unfurls with the same generic card. Static tags in the HTML template come before both, and they win in the same way.

Structured data fails differently. FAQ markup written by hand drifts from the questions shown on the page. Search engines treat markup that does not match the visible content as misleading.

## Must

- Use one head component for each page, and never also in a layout.
- Keep the HTML template free of `og:` and `twitter:` tags.
- Give every page a unique title, a unique description, and one `h1`.
- Use absolute URLs for `og:image`, with the width and the height.
- Set a canonical URL on every page.
- Render FAQ structured data from the same array that renders the visible FAQ.
- Escape the `<` character when you write JSON-LD into the page.
- Publish no doorway pages: near-identical pages that differ only by a keyword.

## Pattern

```svelte
<!-- Seo.svelte -->
<script lang="ts">
	import { page } from '$app/stores';

	export let title: string;
	export let description: string;
	export let image = '/og-image.png';
	export let faq: { question: string; answer: string }[] = [];

	$: origin = $page.url.origin;
	$: imageUrl = image.startsWith('http') ? image : `${origin}${image}`;
	$: faqJsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faq.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: { '@type': 'Answer', text: item.answer }
		}))
	}).replace(/</g, '<');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={`${origin}${$page.url.pathname}`} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	{#if faq.length}
		{@html `<script type="application/ld+json">${faqJsonLd}</` + `script>`}
	{/if}
</svelte:head>
```

The page passes the same `faq` array to this component and to the visible list.

## Should

- Generate every share image and icon from one master file with a script. Hand-exported sizes drift.
- Use a fixed seed for any random element in a generated image, so builds can be repeated.
- Check text contrast on the share image, as you do on the page.
- Test each new page type in each platform's link debugger.
- Serve `robots.txt` and the sitemap from routes that know the live origin.

## Gotchas

- Chat platforms cache unfurls for about a day. Add a throwaway query string, such as `?v=2`, to see a fresh one.
- A template placeholder replaced with a plain string replace can match in more than one place. One build replaced a marker inside an SVG comment as well, and shipped a card with no logo. Replace by exact, unique tokens, and check the output.
- A relative `og:image` works in the browser, and fails in every scraper.
- Large textures in an icon inflate the file. Reduce the colours before you export.

## Validation checklist

- The page source contains exactly one `og:title`, and it is the page's own.
- Two different pages unfurl with two different cards.
- The structured data validator reports no mismatch with the visible content.
- `og:image` is an absolute URL that returns an image of the stated size.
- Every public page has a canonical URL on the production host.

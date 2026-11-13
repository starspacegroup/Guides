---
title: Trust Badges a Visitor Can Check
excerpt: Show a badge only when the result is good, links to the live report, and carries the date it was measured. Keep the results in one data file, and hide stale ones.
difficulty: beginner
tags: Content, Trust, Performance, Accessibility
---

## Rule

A badge on a public page is a claim with evidence attached. It appears only when the measured result passes, it links to the report, and it shows when the measurement was made.

## Why

"Accessible", "Fast", and "Secure" badges are everywhere, and most link to nothing. Visitors have learned to ignore them. A badge that opens a live third-party report, with a recent date, is rare enough to mean something.

The date matters because sites change. A performance score from last year describes a site that no longer exists. A badge that outlives its measurement is the kind of small falsehood that costs a page its credibility when someone clicks.

## Must

- Show a badge only when the result is good. A failing or middling result is work to do, and not a badge.
- Link each badge to the live report, or to a saved copy of it.
- Show the measurement date.
- Hide a badge automatically when its measurement is older than about 90 days.
- Keep results in one data file, and render every badge from it.
- Use vendor names as plain text. Never use a vendor's logo in a way that implies endorsement.
- Decide which badges the page will have before you build the bar. Measure first, and design second.

## Pattern

```ts
// src/lib/trust-badges.ts
export interface TrustBadge {
	label: string;
	reportUrl: string;
	measuredOn: string; // YYYY-MM-DD
	passed: boolean;
}

export const badges: TrustBadge[] = [
	{
		label: 'Performance 100',
		reportUrl: 'https://pagespeed.web.dev/analysis?url=https://example.dev',
		measuredOn: '2026-10-24',
		passed: true
	},
	{
		label: 'WCAG AA contrast',
		reportUrl: '/reports/contrast',
		measuredOn: '2026-10-24',
		passed: true
	}
];

const MAX_AGE_DAYS = 90;

export function visibleBadges(now: Date): TrustBadge[] {
	return badges.filter((badge) => {
		const ageDays = (now.getTime() - new Date(badge.measuredOn).getTime()) / 86_400_000;
		return badge.passed && ageDays <= MAX_AGE_DAYS;
	});
}
```

```svelte
{#each visibleBadges(new Date()) as badge}
	<a href={badge.reportUrl} rel="noopener">
		{badge.label} <span class="measured">measured {badge.measuredOn}</span>
	</a>
{/each}
```

## Should

- Measure the page the badge sits on. A score for the home page says nothing about the checkout.
- Measure again on a schedule, and update the data file in the same commit as the change that affected the score.
- Prefer checks a visitor can run again for themselves.
- Keep the bar short. Three badges with evidence are worth more than eight without.
- State the conditions where they matter, such as mobile or desktop.

## Gotchas

- A decorative effect can cost the badge. One hero animation took a performance score from 100 to 60. Measure after every visual change.
- A badge for a standard you only partly meet is a liability. Claim the part you measured, such as "contrast", and not the whole standard.
- An empty badge bar should render nothing. A heading that reads "Trusted by" with nothing under it is worse than no bar.
- Reports hosted by a third party can expire. Save a copy.

## Validation checklist

- Every badge opens a report that shows the claimed result.
- Every badge shows a date.
- Setting a badge's date to 91 days ago removes it from the page.
- Setting `passed` to false removes it from the page.
- No vendor logo appears without that vendor's permission.

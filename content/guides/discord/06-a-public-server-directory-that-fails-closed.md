---
title: A Public Server Directory That Fails Closed
excerpt: A listing is public only while the server has opted in, an operator has approved it, and its data is fresh. Put all three in the query, so a lapse hides the listing.
difficulty: intermediate
tags: Discord, Privacy, Database
---

## Rule

Whether a community appears in a public directory is a conjunction, enforced in SQL: the admin opted in, an operator approved it, and the metadata was refreshed recently. If any one becomes false, the listing disappears with no further action.

## Why

The first design used the existence of a row as the visibility flag. A row, once written, was never removed. A server that kicked the bot, or was deleted, would have stayed in the public directory for ever, with its old name, icon, and invite.

A single `listed` flag has the same weakness. Something has to remember to clear it. A freshness condition needs nobody to remember. When the bot can no longer see the server, the data goes stale, and the listing drops out.

## Must

- Default opt-in to off. Only a server admin can turn it on.
- Require a separate operator approval before anything is shown.
- Require a recent successful metadata fetch.
- Build every public query on one shared `FROM ... WHERE` fragment, so no route can skip a condition.
- Allow only real Discord invite URLs, and store them in one normal form.
- Keep the operator's fields, such as review status, out of the admin's save path.
- Make member counts a separate opt-in.
- Use one projection function for everything the public sees.

## Pattern

```ts
const LISTING_FRESHNESS_DAYS = 7;

const PUBLIC_FROM = `
  FROM guild_listings l
  JOIN guild_metadata m ON m.guild_id = l.guild_id
  WHERE l.listed = 1
    AND l.review_status = 'approved'
    AND m.fetched_at >= datetime('now', '-${LISTING_FRESHNESS_DAYS} days')`;

export function toPublicListing(row: ListingRow): PublicListing {
	return {
		name: row.name,
		iconUrl: row.icon_url,
		description: row.description,
		joinPath: `/join/${row.slug}`,
		...(row.show_member_count ? { memberCount: row.member_count } : {})
	};
}
```

The freshness constant is the only value placed in the query text, and it is a number from your own code.

## Should

- Route "Join" through your own redirect, such as `/join/<slug>`, which looks up the stored invite. You can then count clicks, and replace a dead invite, without changing the page.
- Count clicks with counters only. Store no cookie, no IP address, and no visitor id.
- Say what you count in the privacy policy, on the day you start to count.
- Send an edited listing back to review when its description changes.
- Tell the admin why a listing is hidden: awaiting review, stale data, or opted out.

## Gotchas

- Docs once said the privacy page covered the click counters, when it did not. Check claims about privacy against the page itself.
- An invite URL allow-list built on `startsWith` accepts a look-alike host. Parse the URL, and compare the host exactly.
- A temporary API outage makes every listing stale at once, if the freshness period is shorter than your worst outage. Choose a period with margin, and alert when the fetch job fails.
- If the admin's save form writes the whole row, it can overwrite the operator's decision. Use separate statements for separate roles.

## Validation checklist

- A server with opt-in on and no approval is not listed.
- Removing the bot from a server removes its listing after the freshness period.
- An invite to any host other than Discord's is rejected.
- The public response never contains a member count for a server that did not opt in to it.
- A search of the routes finds no public query that does not use the shared fragment.

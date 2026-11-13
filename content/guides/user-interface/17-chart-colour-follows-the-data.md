---
title: Chart Colour Follows the Data, Not Its Rank
excerpt: Tie each series colour to the metric it shows through one lookup, so a metric keeps its colour in every chart and removing one never repaints the rest.
difficulty: intermediate
tags: Data, Tokens, Accessibility
---

## Rule

A series gets its colour from what it measures, through one shared lookup. It never gets its colour from its position in the list.

## Why

A dashboard picked colours with `COLORS[index % 5]`. "Sessions" was purple when it was the first metric and green when it was the second. Removing one metric repainted every metric after it. People learn a chart by colour within seconds, and a colour that moves makes them read the legend again every time.

## Must

- Keep one map from metric id to colour token, and use it in every chart.
- Define the series colours as CSS custom properties with a light value and a dark value.
- Fix the palette size. Eight validated hues is a workable limit. When a chart needs a ninth series, group the smallest into "Other".
- Reserve status colours, such as red for errors, for status. A series named "Errors" may use the status colour. A series named "Germany" may not.
- Never rely on colour alone. Keep a legend, and label each row of the tooltip.

## Should

- Use one scale per axis. To compare series with very different sizes, index each to its own period average and say so on the axis.
- Colour by value only when the value has a direction, such as a bounce rate that is better when lower.
- Check each series colour against the chart background at 3:1 for both themes.

## Pattern

```ts
const SERIES_TOKEN: Record<string, string> = {
	page_views: '--series-1',
	sessions: '--series-2',
	users: '--series-3',
	bounce_rate: '--series-4'
};

export function seriesColor(metricId: string): string {
	return `var(${SERIES_TOKEN[metricId] ?? '--series-neutral'})`;
}
```

## Gotchas

- Set SVG colour through `style`, as in `style="stroke: var(--series-1)"`. The `stroke` presentation attribute does not resolve `var()` in every browser.
- A hue nudged by eye in one chart breaks the system. Change the token, and every chart moves together.
- A light-mode step that misses 3:1 is acceptable only when a legend and labels carry the identity.

## Validation checklist

- The same metric has the same colour in every chart on the page.
- Removing a metric does not change any other colour.
- Each chart is readable in a greyscale screenshot with its legend.
- Both themes pass the contrast check for series colours.

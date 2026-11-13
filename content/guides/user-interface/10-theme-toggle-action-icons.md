---
title: Theme Toggle Icons: Show the Next Action
excerpt: A theme toggle is a button, so its icon and label describe what a press will do, not the state the page is already in.
difficulty: beginner
tags: Theming, Accessibility
---

## Rule

A theme toggle shows the action a press will take. In light mode it shows a moon and says "Switch to dark theme". In dark mode it shows a sun and says "Switch to light theme".

## Why

A toggle is a button, and a button label is a promise. A sun icon in light mode reads as a status light: it tells people what they can already see and gives no hint of what the control does. People then press it to find out. The same confusion reaches screen reader users through the accessible name, where "Light theme" on a button sounds like a statement and not a command.

## Must

- Pick the icon from the resolved theme, not from the stored preference. A preference of `system` resolves to light or dark, and the icon follows the result.
- Give the button an `aria-label` that names the action: "Switch to dark theme".
- Keep the icon and the label in step. Derive both from one value.
- Render the same icon on the server and on the client's first paint. If the server cannot know the theme, hide the icon until the theme is applied.

## Should

- Add a `title` with the same words, so the pointer gets a tooltip.
- If the control has three states (light, dark, system), use a menu or a segmented control. A single button that cycles three states cannot show its next action honestly.
- Keep the control in the same place on every page.

## Gotchas

- `aria-pressed` describes a state, so it suits "Dark mode: on" and it does not suit a button named for an action. Use one model or the other, never both.
- An icon that animates from sun to moon is pleasant, and it must end on the icon for the next action.

## Validation checklist

- In light mode the control shows a moon and announces "Switch to dark theme".
- In dark mode the control shows a sun and announces "Switch to light theme".
- With the preference set to `system`, the icon changes when the operating system theme changes.
- No hydration warning appears on first load in either theme.

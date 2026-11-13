---
title: iOS Safari Viewport Rules
excerpt: Three rules for full-height layouts on iPhone: size with svh, combine safe-area insets with max, and remember that a fluid root font changes every rem.
difficulty: intermediate
tags: Layout, Responsive, Mobile
---

## Rule

Size full-height screens with `100svh`. Combine safe-area insets with your own padding by `max()`, not by addition. Declare grid columns as `minmax(0, 1fr)`.

## Why

Each of these came from a layout that looked right on a desktop and broke on a phone.

- `100vh` on iOS is the height with the browser bars hidden. With the bars showing, the bottom of the layout sits under the toolbar. `100dvh` follows the bars, and it moves the layout each time they slide in or out.
- `calc(var(--pad) + env(safe-area-inset-bottom))` stacks two paddings. On a phone with a home indicator the gap doubles, and on a phone without one it is correct, so the bug hides on half your test devices.
- A grid column left as plain `1fr` has an automatic minimum of its content's width. One wide code block pushed a single mobile column to 1910px inside a 390px viewport.

## Must

- Use `min-height: 100svh` for app shells and full-screen panels. Keep `100vh` before it as a fallback for old browsers.
- Write insets as `padding-bottom: max(var(--pad), env(safe-area-inset-bottom))`.
- Add `viewport-fit=cover` to the viewport meta tag, or the `env()` insets are zero.
- Declare article and shell grids with `grid-template-columns: minmax(0, 1fr)`.
- Give `pre` blocks `overflow-x: auto` and a definite width, so they scroll inside the column.

## Should

- Make the root font size fluid when the rem scale was tuned on a desktop: `font-size: clamp(17px, 0.98vw + 13.2px, 22px)`. A flat 22px root made an `h1` render near 60px on a phone.
- Use 16px or more for input text. iOS zooms the page when a smaller input takes focus.
- Design at 390px wide first, then widen.

## Pattern

```css
.shell {
	min-height: 100vh;
	min-height: 100svh;
	padding-bottom: max(1rem, env(safe-area-inset-bottom));
	display: grid;
	grid-template-columns: minmax(0, 1fr);
}

.shell pre {
	max-width: 100%;
	overflow-x: auto;
}
```

## Gotchas

- Desktop browser device emulation does not draw the Safari toolbars. Check on a real phone, or in the iOS simulator.
- A horizontal scrollbar on the whole page usually means one child is wider than the viewport. Find it before you add `overflow-x: hidden` to `body`, which hides the symptom and breaks sticky positioning.

## Validation checklist

- At 390px wide there is no horizontal page scroll on any route.
- The bottom action bar clears the home indicator with one padding, not two.
- A long code block scrolls inside its own box.
- Headings fit the screen at the smallest supported width.

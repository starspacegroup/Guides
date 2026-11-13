---
title: Tooltip or Popover: When to Use Which
excerpt: A tooltip is a short label that appears on hover and focus and holds nothing to click. Anything richer is a popover, opened on purpose.
difficulty: beginner
tags: Interaction, Accessibility
---

## Rule

A tooltip names or briefly describes a control. It holds plain text, appears on hover and on keyboard focus, and contains nothing interactive. If the content has a link, a button, or more than a sentence, use a popover that opens on click.

## Why

A tooltip disappears when the pointer leaves, so nobody can reach a link inside it. It never opens on a touch screen, where there is no hover. Content that matters must not live in a place that half your visitors cannot open.

|           | Tooltip              | Popover                             |
| --------- | -------------------- | ----------------------------------- |
| Opens on  | hover and focus      | click or Enter                      |
| Content   | short text           | text, links, controls               |
| Focus     | stays on the trigger | may move inside                     |
| Closes on | leave, blur, Escape  | Escape, outside click, close button |
| ARIA      | `aria-describedby`   | `aria-expanded`, `aria-controls`    |

## Must

- Show a tooltip on focus as well as on hover.
- Let Escape dismiss a tooltip without moving focus.
- Let the pointer move from the trigger onto the tooltip without closing it. People with screen magnifiers need this.
- Never put the only copy of essential information in a tooltip.
- Give an icon-only button a real accessible name. A tooltip is an extra, not the label.
- Open a popover with a button, and reflect its state in `aria-expanded`.
- Return focus to the trigger when a popover closes.

## Should

- Delay a tooltip slightly on hover, and show it at once on focus.
- Use the platform `popover` attribute where it is supported. It gives light dismiss and top-layer stacking with no script.
- Keep tooltips to one line where possible.

## Gotchas

- The `title` attribute is not a tooltip strategy. It does not appear on focus or touch, and screen readers treat it unevenly.
- A tooltip on a disabled button never shows, because disabled controls do not receive events. Explain the reason in visible text near the button.
- Tooltips near the edge of the screen need collision handling, or they open off screen on a phone.

## Validation checklist

- Every tooltip appears with the Tab key alone.
- Escape hides the tooltip, and focus does not move.
- Nothing inside a tooltip can be clicked.
- Every popover opens and closes from the keyboard, and focus returns to its trigger.
- The page is usable on a touch screen with no hover.

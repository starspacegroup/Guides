---
title: Modal Dialogs: Focus and Close Behavior
excerpt: A modal takes focus when it opens, keeps it while open, gives it back when it closes, and always closes the same three ways.
difficulty: intermediate
tags: Accessibility, Keyboard, Interaction
---

## Rule

A modal dialog moves focus inside itself when it opens, keeps focus inside while it is open, and returns focus to the control that opened it when it closes. Escape, the close button, and a Cancel action all close it.

## Why

A modal says "deal with this first". If focus stays on the page behind it, keyboard and screen reader users are still operating a page they cannot see. If focus does not return on close, they are dropped at the top of the document and must find their place again.

## Must

- Use the native `dialog` element with `showModal()` where you can. It makes the page behind inert and handles Escape.
- Name the dialog with `aria-labelledby` pointing at its heading.
- On open, move focus to the first useful control. For a destructive confirmation, that is the safe action, such as Cancel.
- Keep Tab and Shift+Tab inside the dialog.
- On close, return focus to the element that opened the dialog. Remember that element at open time.
- Close on Escape and on an explicit close button with an accessible name.

## Should

- Close on backdrop click for dialogs with nothing to lose. Do not close on backdrop click when the dialog holds typed input.
- Ask before closing a dialog with unsaved changes.
- Lock page scroll while the dialog is open.

## Gotchas

- On iOS Safari, `overflow: hidden` on `body` does not stop the page scrolling behind an overlay. Fix the body in place instead: set `position: fixed` and `top` to minus the current scroll offset, then restore the scroll position on close.
- If the opener is removed while the dialog is open, such as a deleted row, send focus to a sensible neighbour and not to `body`.
- A dialog opened from inside a menu must close the menu first, or focus returns to an element that is no longer visible.
- Two stacked modals are a design smell. Replace the content of the first.

## Validation checklist

- Opening moves focus into the dialog.
- Tab never reaches the page behind.
- Escape closes the dialog, and focus returns to the opener.
- A screen reader announces the dialog title on open.
- The page behind does not scroll on a phone.

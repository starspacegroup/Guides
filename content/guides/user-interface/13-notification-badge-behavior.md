---
title: Notification Badge Behavior
excerpt: A badge counts things that need attention. Decide what clears it, cap the number, and tell assistive technology without shouting.
difficulty: beginner
tags: Feedback, Accessibility
---

## Rule

A badge shows how many items need attention. The count goes down only when the person has seen or handled an item, and the same rule applies on every device.

## Why

A badge is a small promise that something is waiting. A badge that never clears teaches people to ignore it. A badge that clears by itself, before anyone looked, hides the one thing they needed.

## Must

- Define what clears an item: opening the list, opening the item, or acting on it. Write the rule down and apply it everywhere.
- Hide the badge at zero. An empty dot or a "0" is noise.
- Cap the display. Show "99+" and not a four-digit number that breaks the layout.
- Put the count in the accessible name of the control: "Notifications, 3 unread".
- Announce changes politely. Use a status region with `aria-live="polite"`, and never `assertive` for a counter.

## Should

- Use a dot without a number when the amount does not matter, only the fact that something is new.
- Keep the badge colour for attention only. Do not reuse it for decoration elsewhere on the page.
- Sync the count across tabs and devices from the server's record, not from local state.

## Gotchas

- Clearing on "list opened" marks things read that were below the fold. If the list is long, clear only what was shown.
- An optimistic decrement that the server later rejects makes the number jump back. Reconcile with the server count after each action.
- A counter that updates every few seconds and is announced each time makes a screen reader unusable. Announce on a meaningful change, such as zero to one.
- Colour alone does not carry the message. The dot needs a text alternative.

## Validation checklist

- The badge is absent at zero and reads "99+" above the cap.
- A screen reader reads the count as part of the button name.
- Reading an item on one device lowers the count on another.
- The count never goes negative and never grows without a new item.

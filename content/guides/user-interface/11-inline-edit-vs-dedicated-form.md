---
title: Inline Edit or a Dedicated Form
excerpt: Edit one low-risk field in place. Send anything with several fields, validation between them, or a consequence to a form of its own.
difficulty: beginner
tags: Forms, Interaction
---

## Rule

Use inline editing for one field with no consequences. Use a dedicated form when the change touches several fields, has rules that link them, or needs a confirmation.

## Why

Inline editing removes a page load and keeps the person in context. It also removes everything a form gives you: room for help text, a place for errors that involve two fields, a clear Save and Cancel, and a URL to return to. When an inline edit grows a second field, people lose track of what has been saved and what has not.

## Choose inline when

- The value is a single field, such as a display name or a title.
- A wrong value is easy to see and easy to undo.
- Validation needs only that field.

## Choose a form when

- Two or more fields change together, such as an address.
- The change has a consequence: billing, permissions, a public URL.
- The person needs help text, examples, or a preview.
- You need a confirmation step.

## Must

- Make the editable value reachable by keyboard. A real button named "Edit name" is better than a click target on plain text.
- Move focus into the input when editing starts, and back to the Edit button when it ends.
- Save on Enter and cancel on Escape. Show both actions as visible buttons too.
- Keep the old value on screen until the save succeeds. If the save fails, keep the draft and show the error next to the field.
- Give the input a label. A visually hidden label is enough.

## Should

- Offer both: an inline edit for the common field and a link to the full form for the rest.
- Decide what blur means and stay consistent. Saving on blur surprises people when they click away to copy something. Cancelling on blur loses work. A visible Save button avoids both.

## Gotchas

- An optimistic update that silently reverts after a failed save looks like the product ate the change. Say that it failed.
- Inline edits inside a table row need a clear single-row edit mode, or two rows end up half edited.

## Validation checklist

- The edit starts, saves, and cancels from the keyboard alone.
- Focus returns to the Edit control after save and after cancel.
- A failed save keeps the draft and shows a message.
- Multi-field changes open the dedicated form.

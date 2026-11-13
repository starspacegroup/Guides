---
title: One Action Surface for People and for AI
excerpt: Every button, shortcut and AI move goes through the same typed dispatch function. The AI can then do exactly what a person could do, and nothing else.
difficulty: intermediate
tags: AI, Architecture, State
---

## Rule

State changes only through `dispatch(action)`, where `action` is a member of one typed union. The interface calls it, the keyboard calls it, and the AI calls it. The AI's tool list is generated from the same definition.

## Why

When an assistant gets its own code path into an app, it gains abilities the interface does not have, and it loses the checks the interface has. Its changes skip undo. Its inputs skip validation. Its results can be numbers the app never computed.

A calculator shows the stakes in a small space. If the model may write a result to the tape, the tape can contain arithmetic that the calculator did not do. With one action surface the model can press keys, and the calculator does the arithmetic. Every digit on screen then came from the engine, whoever asked.

## Must

- Define each action once, with a name, a description, and a schema for its arguments.
- Route every change through one `dispatch`. No component writes to state directly.
- Validate each action with a parser before dispatch, including actions that came from your own interface.
- Generate the AI tool schemas from the action definitions, so the two cannot drift apart.
- Allow no action that computes or asserts a result. Actions express intent, and the engine produces results.
- Group the actions from one AI request into one undo step.
- Keep secrets out of the state description you send to the model.

## Pattern

```ts
export const ACTION_SPEC = {
	press_key: {
		description: 'Press one key on the keypad',
		args: { key: { type: 'string', enum: KEYS } }
	},
	clear: { description: 'Clear the current entry', args: {} },
	set_angle_mode: {
		description: 'Switch between degrees and radians',
		args: { mode: { type: 'string', enum: ['deg', 'rad'] } }
	}
} as const;

export type Action = ReturnType<typeof parseAction>;

/**
 * This is the only way anything changes. Every key on the keypad, every
 * keyboard shortcut, and every move the AI makes goes through dispatch.
 */
export function dispatch(action: Action): void {
	state = reduce(state, action);
}

export const toolSchemas = Object.entries(ACTION_SPEC).map(([name, spec]) => ({
	name,
	description: spec.description,
	input_schema: { type: 'object', properties: spec.args, required: Object.keys(spec.args) }
}));
```

## Should

- Give the model a `describe()` of the current state in plain text, built from the same state the screen shows.
- Run the tool loop in the page, and keep the model proxy stateless. The proxy then holds no user data.
- Show each AI action in the interface as it happens, in the place where a person would have clicked.
- Reuse the surface for a command palette and for end-to-end tests.
- Refuse a batch as a whole if any action in it fails to parse.

## Gotchas

- A convenience action such as `set_result` is the hole this design exists to prevent. Refuse it in review.
- If the union and the tool list are written by hand in two places, they will differ within a month.
- An AI that issues fifty actions leaves fifty undo steps, unless you batch them.
- Read-only questions need no action at all. Let the model answer from `describe()`.

## Validation checklist

- A search of the codebase finds state writes only inside the reducer.
- Adding an action to the spec adds a tool with no other edit.
- One AI request is undone by one undo.
- Every value on screen can be reproduced by replaying the action log.

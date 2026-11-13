---
title: Vitest Traps: Leaked Stubs and Fake Environments
excerpt: Five setup faults that make a suite pass alone and fail together, or pass while testing nothing. Each has a one-line fix in the config or the setup file.
difficulty: intermediate
tags: Testing, Vitest, Svelte
---

## Rule

Fix environment gaps once, in the config and the setup file. A test that passes alone and fails in the full run is reporting shared state, not flakiness.

## Trap 1: global stubs that outlive their test

A suite replaced `crypto` with an object that had only `randomUUID`. A later suite called `crypto.subtle` and crashed. Each file passed when run alone.

```ts
// vite.config.ts
test: {
	unstubGlobals: true;
}
```

With this set, `vi.stubGlobal` is undone after each test. Restore `navigator` stubs by hand even so, because the property comes from the prototype and has no own descriptor to put back.

## Trap 2: Svelte resolves its server build

Without the browser condition, component tests import Svelte's server build, where `onMount` does nothing. Tests then assert on markup from before mount, and pass.

```ts
// vite.config.ts
resolve: {
	conditions: ['browser'];
}
```

If a component test passes with the body of `onMount` deleted, this is the cause.

## Trap 3: Node's own localStorage

Recent Node versions define a global `localStorage` that is inert unless a file path is given. It shadows the one from the DOM test environment. The suite fails on a developer's machine and passes in CI, or the reverse, depending on the Node version.

```ts
// tests/setup.ts
Object.defineProperty(globalThis, 'localStorage', {
	value: window.localStorage,
	configurable: true
});
```

## Trap 4: text nodes that swallow zero

One DOM test environment turned `createTextNode(0)` into an empty node. A counter that showed `0` rendered as blank in tests only.

```ts
// tests/setup.ts
const createTextNode = document.createTextNode.bind(document);
document.createTextNode = ((data: unknown) =>
	createTextNode(String(data))) as typeof document.createTextNode;
```

## Trap 5: work left on the queue

A component scheduled an animation frame. The test ended, and the callback ran during the next file against a DOM that had been torn down. Cancel timers and frames in the component's cleanup, and flush them in the test before it ends.

## Must

- Run files in sequence when they share a DOM environment, until you have proved they are isolated.
- Find controls by role and accessible name. A test that finds a button by its class passes after the button has become unusable.
- Assert on what the user would see after mount, not on the first render.
- Make a test that needs storage, crypto, or timers set them up by itself, and rely on automatic restore.

## Should

- Set a short teardown timeout, so a leaked handle fails loudly.
- Treat a test that starts failing after you fix the environment as a result. It was passing for the wrong reason.
- Run the full suite twice in a row before you call a suite stable.
- Keep the setup file small, and comment each workaround with the fault it repairs.

## Validation checklist

- Running any single file gives the same result as running it in the full suite.
- Deleting the body of an `onMount` makes a component test fail.
- The suite passes on each Node version the project supports.
- No test finds an element by a CSS class.

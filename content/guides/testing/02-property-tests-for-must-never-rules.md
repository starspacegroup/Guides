---
title: Property Tests for "Must Never" Rules
excerpt: Put retention, limits and permission rules in a module with no I/O, then state what must never happen and let a generator hunt for the case that breaks it.
difficulty: intermediate
tags: Testing, Property Tests, Verification
---

## Rule

A rule with the word "never" in it lives in a pure module, and it has a property test that states the "never" directly.

## Why

Example tests check the cases you thought of. A rule such as "retention never deletes a pinned recording" fails on a case you did not think of: a pinned file that is also the oldest, a zero-length list, two files with the same timestamp. A property test generates hundreds of inputs and reports the smallest one that breaks the rule.

The pure module is what makes this cheap. A function from data to a decision needs no database, no clock, and no file system to test.

## Must

- Separate the decision from the action. `toDelete(files, now)` returns a list. Another function deletes.
- Pass the clock in as a value. A function that reads the time by itself cannot be tested at a chosen moment.
- Write one property for each "never" and each "always".
- Generate inputs that include the awkward ones: empty, one item, duplicates, and boundary values.
- Keep the failing seed that the tool prints, and add that case as a plain example test.

## Pattern

Python with Hypothesis:

```python
@given(chunks, now)
def test_never_deletes_pinned(cs, t):
    assert not (to_delete(cs, t) & pinned(cs))

@given(chunks, now)
def test_only_names_buffer_files(cs, t):
    assert all(path.startswith("buffer/") for path in to_delete(cs, t))
```

TypeScript with fast-check:

```ts
it('a deny always beats an allow', () => {
	fc.assert(
		fc.property(arbitraryGrants, arbitraryChannel, (grants, channel) => {
			const denied = withDeny(grants, channel.id, 'read');
			expect(computePermissions(denied, channel).has('read')).toBe(false);
		})
	);
});
```

## Properties worth writing

- **Never.** The output never contains something forbidden.
- **Bound.** The result stays inside its limits for any input.
- **Round trip.** Parsing what you printed returns the original.
- **Unchanged when valid.** A fixer leaves a correct input alone.
- **Agreement.** A fast implementation matches a slow and obvious one.
- **Isolation.** A reader of A never receives data that belongs to B.

## Should

- Start with the property that would cost the most if it were false.
- Use many runs for cheap pure functions. Five thousand is reasonable.
- Property-test the float edges. `5.6 - 5.1` is not `0.5`, and a threshold at half a point will misfire. Compare scaled integers.
- Count what a generator produces when the count matters. One difficulty curve was built for eight levels, and the generator made seven.

## Gotchas

- A property that restates the implementation proves nothing. State the rule from the user's side.
- Generators that rarely hit the interesting case give false comfort. Bias them toward the boundaries.
- Shrunk counterexamples can look absurd. They are still real inputs.
- A slow property gets skipped. Keep I/O out.

## Validation checklist

- The rules module imports nothing that does I/O.
- Each "never" in the spec maps to a named property.
- Breaking the rule on purpose makes the property fail within seconds.
- Each counterexample ever found is kept as an example test.

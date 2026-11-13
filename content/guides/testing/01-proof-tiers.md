---
title: Proof Tiers: Property Tests, Then Dafny, Then Lean
excerpt: Every rule gets property tests. A high-stakes pure core gets a verified implementation. A theorem prover is for designs, not for shipped code. We measured why.
difficulty: advanced
tags: Testing, Verification, Property Tests
---

## Rule

Match the strength of the check to the cost of being wrong.

| Tier | Use it for                                                        | Tool                                       |
| ---- | ----------------------------------------------------------------- | ------------------------------------------ |
| 1    | every feature that has a rule                                     | property tests, in the same change         |
| 2    | sign-in, permissions, rate limits, money, isolation between users | a pure core in Dafny, compiled and shipped |
| 3    | designs and mathematics that are not shipped code                 | Lean                                       |

## Why

We ran a blind comparison on five real cases. A theorem prover had already found bugs in four of them. Property tests, written with no knowledge of those findings, found all five bugs, including those four. They took about a quarter of the wall time and a quarter of the tokens. They also found problems the formal models had never covered: a drifting meter, a cap that silently dropped items, and two unchecked colour tokens.

For the login throttle, we then wrote the rule in Dafny. It verified 19 conditions in under two seconds. The whole effort cost about a third of the theorem-prover work on the same case. The Dafny output is the code that ships, so no gap remains between the model and the program.

The comparison was small: five cases, one run each, judged by the author. Treat the ratios as a direction, not a law.

## What found the bugs

In every case the work that found the bug was writing the rule down. "A user cannot be locked out by someone else's failed attempts" is a sentence nobody had written before either tool asked for it. The tools differ in how sure they make you afterwards.

## Must

- Write the rule as a sentence before you write the test.
- Aim the property at the rule. An untargeted random run missed the lockout bug until a property hammered one email from one address.
- Ship property tests in the same change as the feature.
- For tier 2, keep the proved core pure. It takes values and returns values. Storage, clocks, and the network stay in a thin wrapper.
- Keep a differential test between the wrapper and the core, because the wrapper is not proved.
- Treat generated code as read-only. The `.dfy` file is the source.
- State what the model assumes and what it leaves out.

## Pattern

A targeted property, with fast-check:

```ts
it('one address cannot lock another address out', () => {
	fc.assert(
		fc.property(fc.array(fc.boolean(), { maxLength: 200 }), (attempts) => {
			const state = attempts.reduce(
				(current, correct) => attempt(current, 'attacker-ip', 'owner@example.com', correct).state,
				emptyState
			);
			expect(attempt(state, 'owner-ip', 'owner@example.com', true).result).toBe('ok');
		})
	);
});
```

## Should

- Record a proved violation that you have not fixed yet as an expected-failure test. It flips to a pass when someone fixes the code, and the suite tells them.
- Run an exhaustive check when the domain is finite and small enough. All 16.7 million background colours took about two minutes.
- Use a theorem prover when the property is about real numbers or an unbounded protocol, and no test can cover it.

## Gotchas

- Dafny integers compile to a big-number type. Convert at the boundary, and expect the extra library in your bundle.
- A proof holds for the model. One model without a clock missed a timing rule that the timed model later corrected.
- A proof written after the fix guards against the bug's return. It did not discover the bug. Say which it was.

## Validation checklist

- Each rule in the feature has a property test that names it.
- Each tier 2 core has a proof that runs in CI, and a wrapper test.
- The docs say which tier each critical rule is on.

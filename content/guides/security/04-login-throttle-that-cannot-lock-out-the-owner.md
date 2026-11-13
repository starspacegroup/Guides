---
title: A Login Throttle That Cannot Lock Out the Owner
excerpt: A limit on failed attempts per email lets anyone lock a victim out. Limit per address first, set the per-email limit much higher, and prove the rule.
difficulty: advanced
tags: Authentication, Rate Limiting, Security, Verification
---

## Rule

Count failed sign-ins per client address with a low limit and per email with a much higher one. Keep the decision in a pure function, and prove the property that matters: one address cannot lock another person out.

## Why

The first version allowed eight wrong passwords per email, then refused that email for fifteen minutes. A formal model of the rule produced a counterexample at once: eight wrong passwords for the owner's email, sent from any address, locked the owner out everywhere. A throttle built to protect accounts was a tool for denying access to them.

The fix keeps the per-address limit at 8 and sets the per-email limit to 64. A single address is stopped by its own limit long before the email limit is reached. A success clears only the email counter, so an attacker cannot reset their own address counter with one known-good account.

## Must

- Throttle on the address counter or the email counter, whichever trips.
- Set the email limit to several times the address limit.
- Write the decision as a pure function of the counters and the time. Keep the storage reads and writes in a thin wrapper.
- State the accepted limitation: with enough distinct addresses, an attacker can still reach the email limit.
- Fail open when the counter store is unavailable. The throttle raises the cost of guessing. It is not what authorises a sign-in.
- Check the throttle before the password hash runs, because the hash is the expensive step.

## Pattern

The core, in Dafny, with the lemma that states the guarantee:

```dafny
function Throttled(ipCount: int, emailCount: int, emailExpiresAt: int, now: int): bool {
  ipCount >= MaxAttempts
    || EffectiveEmailCount(emailCount, emailExpiresAt, now) >= EmailMaxAttempts
}

lemma SingleIpCannotLockOut(a: string, b: string, e: string, rs: seq<Req>, now: int, t: int)
  requires a != b && now >= 0 && Sorted(rs, now)
  requires forall i :: 0 <= i < |rs| ==> rs[i].ip == a
  ensures Attempt(Run(Empty, rs), b, e, true, t).1 == Ok
```

In words: after any run of requests that all come from address `a`, a correct password from a different address `b` still succeeds.

The proved functions are compiled to JavaScript and called from the route. The route owns the storage calls and nothing else.

## Should

- Start with a property test. A test that hammers one email from one address and then signs in from another finds this bug in seconds.
- Use a proof tool when the rule guards sign-in, lockouts, money, or isolation between users, and the core is a pure function.
- Return the same message for a throttled attempt and a wrong password, and send a `Retry-After` header.
- Keep a differential test between the compiled core and the wrapper, because the wrapper is not proved.

## Gotchas

- Dafny integers compile to big-number objects. Convert at the boundary, and budget for the added library in the bundle.
- The compiler output is CommonJS. A build script has to wrap it as an ES module, and the generated file is never edited by hand.
- Workers KV refuses an expiry less than 60 seconds away. The model needs that rule too, or the code and the proof disagree.
- KV is eventually consistent, so counts can run slightly low under a burst. Acceptable for a throttle, and a reason never to use it for a hard limit.

## Validation checklist

- Eight wrong passwords from one address block that address and not the account.
- After those eight, the right password from another address signs in.
- With the counter store down, a correct password still signs in.
- The proof verifies in CI, or the generated file is checked against a fresh build.

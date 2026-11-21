# Discord login

The Discord login rules, shared with the NebulaKit template and every site built on it. The
rules below came from running Discord login on PinFool and the other NebulaKit sites; each exists
because the simpler version went wrong.

## Flow

`/api/auth/discord` starts the flow (scope `identify email`, signed state, single-use transaction).
`/api/auth/discord/callback` calls `completeOAuth('discord', event)` in `src/lib/server/oauth-flow.ts`,
the flow Guides shares between GitHub and Discord (this fork's own shape; the template has a
per-provider callback). For Discord it exchanges the code, reads the profile, reconciles it with an
account (`reconcileOAuthAccount`), applies the profile (`applyDiscordProfile`, the identity's
`afterReconcile` step) and signs the person in (`finalizeOAuthLogin`). Credentials come from
`DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`, or the admin Auth keys page (stored sealed in KV).

## What Discord may say about an account

All of it is decided in `src/lib/utils/discord-identity.ts` (pure, property tested).

- **Only a verified address matches an account.** Discord returns unverified addresses too; matching
  one would let anyone who registers a Discord account with a victim's email take that account over.
- **No address, no problem.** A new account without one gets `username@discord.local`, a placeholder
  that is never treated as verified and never mailed. Guides is stricter than the template here: an
  address Discord has not verified is not stored on a new account either (the placeholder is used),
  so a later GitHub login with that email cannot match it.
- **A placeholder is replaced, a chosen address never is.** On the next sign-in with a verified
  address, `@discord.local` becomes the real one. An address the person picked stays.
- **`users.email_verified_at`** is set only when Discord confirmed the address the account holds.
  Gate anything on it that must not be claimed by typing an address into a form (store credit,
  order history).
- **Avatar** is always an `https://cdn.discordapp.com` URL, built from an id and hash that look like
  Discord's own, else one of the six default avatars. It is stored in `users.github_avatar_url`
  (the column every avatar is read from) on every sign-in.
- **`users.last_login_at`** is written on every sign-in, whatever the provider.
- Every profile step fails soft: a missing picture or an unmigrated column never blocks a sign-in.

Migration `0016_user_email_verified_last_login.sql` adds the two columns. Until it runs, sign-in
still works and these two facts are simply not recorded.

## Tests

`tests/unit/discord-identity.test.ts` (property tests, fast-check) covers the pure policy.
`tests/unit/discord-profile.test.ts` runs `applyDiscordProfile` against the real migrations through
`tests/helpers/sqlite-d1.ts` (Node's built-in `node:sqlite`); it skips itself on Node older than 22.5,
which includes this repo's CI Node 20. The callback and `last_login_at` paths are covered with mocks in
`oauth-email-verification.test.ts` and `oauth-finalization.test.ts`, which run everywhere.

Do not change the policy here on its own: it is shared with the template. Change
`src/lib/utils/discord-identity.ts` there first, then port it.

---
title: Credential Forms: POST, and Field Names of Your Own
excerpt: A sign-in form with no method submits as GET before JavaScript loads and puts the password in the URL. Declare POST, and prefix credential field names.
difficulty: beginner
tags: Authentication, Forms, Security
---

## Rule

Every form that takes a credential declares `method="POST"`. The `id` and `name` of each credential field carry a prefix that is unique to the site.

## Why

A sign-in form handled its submit in JavaScript and had no `method` attribute. A form with no method defaults to GET. When someone pressed Enter before the page had hydrated, the browser submitted the form itself, and the email and password went into the query string. From there they reached the browser history, the server access log, and the logs of the tunnel in front of the dev server.

The prefix solves a different problem. Password managers match saved logins by host. Two apps on `localhost`, or on sibling preview hosts, share a host, so the manager offers one app's password to the other. A field named `myapp-password` gives the manager and the browser a second signal.

## Must

- Write `method="POST"` on every form with a password, a token, a one-time code, or an API key.
- Make the form work without JavaScript, or at least fail safely without it.
- Keep the standard `autocomplete` tokens: `username`, `current-password`, `new-password`, `one-time-code`.
- Build field identifiers through one helper, and use it for `id`, `name`, and the label's `for`.
- Add a test that fails when a credential route contains a hard-coded `id`, `name`, or `for`.

## Pattern

```ts
// form-fields.ts
export const fieldPrefix = site.slug;

export function fieldName(base: string): string {
	return `${fieldPrefix}-${base}`;
}
```

```svelte
<form method="POST" action="?/login">
	<label for={fieldName('email')}>Email</label>
	<input
		id={fieldName('email')}
		name={fieldName('email')}
		type="email"
		autocomplete="username"
		required
	/>

	<label for={fieldName('password')}>Password</label>
	<input
		id={fieldName('password')}
		name={fieldName('password')}
		type="password"
		autocomplete="current-password"
		required
	/>

	<button type="submit">Sign in</button>
</form>
```

## Should

- Use progressive enhancement, such as SvelteKit's `use:enhance`, so the same POST works before and after hydration.
- Send `Cache-Control: no-store` on responses to credential posts.
- Keep credentials out of redirects. Redirect to a clean URL after a successful post.
- Test the form once with JavaScript turned off.

## Gotchas

- The prefix changes the names the server reads. Use the same helper on the server.
- A GET form leaks through the `Referer` header too, on the next navigation.
- Search forms are fine as GET. The rule is about secrets, not about forms in general.
- If a secret has already reached a log through this path, treat it as exposed, and rotate it.

## Validation checklist

- With JavaScript off, a sign-in submit sends a POST and the URL has no query string.
- A search of the credential routes finds no literal `name="password"`.
- The password manager offers this site's login only, with two local apps running.
- The server access log for a sign-in shows a path and no credentials.

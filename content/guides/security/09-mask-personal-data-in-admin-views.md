---
title: Mask Personal Data in Admin Views
excerpt: Admin screens get shared, recorded and screenshotted. Mask names, emails and addresses on the server by default, and make a reveal explicit, short and logged.
difficulty: intermediate
tags: Privacy, Admin, Security
---

## Rule

Personal data in admin views is masked on the server before it reaches the browser. Showing the real values needs a permission and a deliberate action that expires by itself.

## Why

An admin user list ends up in bug reports, screen shares, and recorded demos. If the real values are in the page, each of those is a small leak of your users' details. Masking in CSS or in client code does not help, because the values are still in the response and in the page source.

## Must

- Mask in the server load function. The response must not contain the real value while masking is on.
- Use a masker per type: one for names, one for emails, one for everything else.
- Keep enough of the value to recognise a record, such as the first letter and the email's domain.
- Require two things to reveal: a permission on the account, and a short-lived flag the admin sets on purpose, such as a cookie that lasts an hour.
- Treat any other state as masked. A missing cookie, an unknown value, or a failed permission check all mean masked.
- Write an audit entry each time reveal is turned on, with who and when.
- Store IP addresses in full if you need them for abuse handling, and mask them on display.

## Pattern

```ts
export function maskEmail(email: string | null | undefined): string {
	if (!email) return '***@***.***';
	const at = email.indexOf('@');
	if (at < 1) return email[0] + '*'.repeat(Math.max(email.length - 1, 3));
	const local = email.slice(0, at);
	const domain = email.slice(at);
	return local[0] + '*'.repeat(Math.max(local.length - 1, 2)) + domain;
}

export function canRevealPii(locals: App.Locals, cookies: Cookies): boolean {
	return hasPermission(locals, 'pii') && cookies.get('pii_reveal') === '1';
}
```

```ts
// +page.server.ts
const reveal = canRevealPii(locals, cookies);
return {
	users: rows.map((row) => ({
		id: row.id,
		name: reveal ? row.name : maskName(row.name),
		email: reveal ? row.email : maskEmail(row.email)
	}))
};
```

## Should

- Keep internal ids visible. Admin actions need them, and they are not personal data in themselves.
- Scrub audit log details by key name before you store them: `token`, `secret`, `password`, `code`, `key`. Keep keys that end in `Id`.
- Show a visible banner while reveal is on.
- Make search work on the server against real values, and return masked results.

## Gotchas

- Masking the list and not the detail page, the export, or the API response behind them is the usual miss. Check every route that returns a user.
- A stable mask length reveals the length of the value. A minimum number of stars hides very short values.
- If the written policy says "owner only" and the code says "anyone with the permission", one of them is wrong. Reconcile them, and test the one you keep.

## Validation checklist

- With reveal off, the network response for the user list contains no full email.
- Reveal turns itself off after its time limit.
- An admin without the permission cannot reveal, even with the cookie set by hand.
- Each reveal has an audit entry.

---
title: Secrets at Rest: Seal Them, Bind Them, Never Show Them
excerpt: API keys kept in a key-value store are sealed with AES-GCM under a per-purpose key, bound to their record, and shown again only as four characters.
difficulty: advanced
tags: Encryption, Secrets, Security, KV
---

## Rule

Every stored secret goes through one seal and open helper. Each ciphertext is bound to its purpose and record id, and no endpoint returns the plaintext.

## Why

A setup guide said admin-entered API keys were "stored encrypted". They were plain JSON in the key-value store. The claim was written before the code, and nobody checked it. Anyone with read access to the namespace, including every other project that had been bound to it by mistake, could read the keys.

## Must

- Seal with AES-256-GCM and a fresh random 12-byte IV each time.
- Derive one subkey per purpose from the root key with HKDF-SHA-256. Provider keys and OAuth client secrets then never share a key.
- Pass `purpose:recordId` as additional authenticated data. A ciphertext copied onto another record fails to open.
- Write a version prefix into the envelope, such as `v1.<iv>.<ciphertext>`.
- Treat a malformed root key as an error. Never fall back to storing plaintext.
- Return a `configured` flag and the last four characters to the client. Return no hint for secrets under 12 characters.

## Pattern

```ts
export async function seal(env: Env, purpose: string, recordId: string, plaintext: string) {
	const roots = await rootKeys(env);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv, additionalData: aad(purpose, recordId) },
		await deriveSubkey(roots[0], purpose),
		new TextEncoder().encode(plaintext)
	);
	return `v1.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
}

const aad = (purpose: string, recordId: string) =>
	new TextEncoder().encode(`${purpose}:${recordId}`);
```

## Should

- Support rotation with a second setting for the previous key. `open` tries the current key, then the previous one, and reports `rotated: true` so the caller can seal again with the current key.
- Plan a sweep after a rotation. Sealing again only on read leaves untouched records under the old key.
- Set the root key as a platform secret. If you generate one into storage when none is set, say plainly in the docs that this is weaker: the key then sits beside the data it protects.
- Scrub secrets from audit logs by key name, such as `token`, `secret`, `password`, and `key`.

## Gotchas

- Copying the store to another project needs the same root key, or every secret fails to open.
- A "reveal" button for a stored secret defeats the design. To change a secret, enter a new one.
- Logging a request body on error can write the secret to the logs before it is sealed.
- Docs that describe protection you have not built are worse than no docs. Check each security claim against the code.

## Validation checklist

- The raw stored value starts with the version prefix and contains no readable key.
- Moving a ciphertext to another record id fails to open.
- The admin API never returns more than four characters of a secret.
- After rotation, old records open and are sealed again under the new key.

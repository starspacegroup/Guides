import { describe, expect, it, vi } from 'vitest';
import { requireOwner } from '$lib/server/auth-guards';
import { sanitizeCmsUrl } from '$lib/cms/sanitize';
import { createSessionToken, hashSessionToken } from '$lib/utils/session';
import { getConfiguredChatModels, selectDefaultChatModel } from '$lib/services/openai-chat';
import { isPiiRevealed, maskEmail } from '$lib/server/pii-mask';
import { getTurnstileConfig } from '$lib/server/turnstile';

describe('inherited security boundaries', () => {
	it('uses high-entropy session tokens and stores only stable digests', async () => {
		vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
			(array as Uint8Array).fill(7);
			return array;
		});
		const token = createSessionToken();
		expect(token).not.toContain('=');
		expect(await hashSessionToken(token)).not.toBe(token);
		expect(await hashSessionToken(token)).toBe(await hashSessionToken(token));
	});

	it('keeps owner-only operations closed to ordinary admins', () => {
		expect(() =>
			requireOwner({ user: { id: 'admin', isAdmin: true, isOwner: false } } as App.Locals)
		).toThrow();
		expect(requireOwner({ user: { id: 'owner', isOwner: true } } as App.Locals).id).toBe('owner');
	});

	it('rejects executable and protocol-relative CMS URLs', () => {
		expect(sanitizeCmsUrl('javascript:alert(1)')).toBeNull();
		expect(sanitizeCmsUrl('//evil.example/path')).toBeNull();
		expect(sanitizeCmsUrl('/guide/path')).toBe('/guide/path');
		expect(sanitizeCmsUrl('https://example.com/path')).toBe('https://example.com/path');
	});

	it('allows only configured known chat models', () => {
		const models = getConfiguredChatModels({
			id: 'key',
			name: 'OpenAI',
			provider: 'openai',
			apiKey: 'secret',
			enabled: true,
			models: ['gpt-4o', 'attacker-model']
		});
		expect(models).toEqual(['gpt-4o']);
		expect(selectDefaultChatModel(['gpt-4o', 'gpt-4o-mini'])).toBe('gpt-4o-mini');
	});

	it('masks PII unless the owner explicitly opts in', () => {
		expect(maskEmail('person@example.com')).toBe('p*****@example.com');
		expect(isPiiRevealed({ isOwner: false, isAdmin: true }, '1')).toBe(false);
		expect(isPiiRevealed({ isOwner: true }, '1')).toBe(true);
	});

	it('enables Turnstile only with a paired site and secret key', () => {
		expect(getTurnstileConfig('site', undefined)).toMatchObject({
			enabled: false,
			error: expect.any(String)
		});
		expect(getTurnstileConfig('site', 'secret')).toEqual({
			enabled: true,
			siteKey: 'site',
			secretKey: 'secret'
		});
	});
});

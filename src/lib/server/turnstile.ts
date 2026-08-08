export type TurnstileConfig =
	| { enabled: false; error?: string }
	| { enabled: true; siteKey: string; secretKey: string };

export function getTurnstileConfig(
	siteKey?: string | null,
	secretKey?: string | null
): TurnstileConfig {
	const site = siteKey?.trim();
	const secret = secretKey?.trim();
	if (!site && !secret) return { enabled: false };
	if (!site || !secret)
		return {
			enabled: false,
			error: 'Turnstile requires both TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY.'
		};
	return { enabled: true, siteKey: site, secretKey: secret };
}

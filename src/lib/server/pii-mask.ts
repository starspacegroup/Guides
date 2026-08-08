export type RoleFlags = { isOwner?: boolean; isAdmin?: boolean };

export function maskName(name: string | null | undefined): string {
	if (!name) return '*** ***';
	return name
		.split(' ')
		.filter(Boolean)
		.map((word) => (word.length <= 1 ? word : word[0] + '*'.repeat(word.length - 1)))
		.join(' ');
}

export function maskEmail(email: string | null | undefined): string {
	if (!email) return '***@***.***';
	const at = email.indexOf('@');
	if (at < 1) return email[0] + '*'.repeat(Math.max(email.length - 1, 3));
	const local = email.slice(0, at);
	return local[0] + '*'.repeat(Math.max(local.length - 1, 2)) + email.slice(at);
}

export function maskGeneric(value: string | null | undefined): string {
	if (!value) return '***';
	if (value.length <= 4) return value[0] + '*'.repeat(value.length - 1);
	return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
}

export function isPiiRevealed(user: RoleFlags | null | undefined, cookie?: string): boolean {
	return Boolean(user?.isOwner && cookie === '1');
}

export const PII_REVEAL_COOKIE = 'pii_reveal';
export const PII_REVEAL_MAX_AGE = 60 * 60;

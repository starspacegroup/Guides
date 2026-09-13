function decodeUrlEntities(value: string): string {
	return value
		.replace(/&#(?:x([0-9a-f]+)|(\d+));?/gi, (_match, hex: string, decimal: string) =>
			String.fromCodePoint(Number.parseInt(hex || decimal, hex ? 16 : 10))
		)
		.replace(/&(amp|colon|newline|tab);/gi, (_match, entity: string) => {
			const entities: Record<string, string> = { amp: '&', colon: ':', newline: '\n', tab: '\t' };
			return entities[entity.toLowerCase()];
		});
}

export function sanitizeCmsUrl(raw: string, image = false): string | null {
	const decoded = decodeUrlEntities(raw)
		.replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
		.trim();
	if (!decoded) return null;
	const normalized = decoded.replace(/\s/g, '').toLowerCase();
	if (/^[\\/]{2}/.test(normalized)) return null;
	if (/^(\/|#|\.\.?\/)/.test(normalized)) return decoded;
	const colon = normalized.indexOf(':');
	const firstPathCharacter = normalized.search(/[/?#]/);
	if (colon >= 0 && (firstPathCharacter < 0 || colon < firstPathCharacter)) {
		const schemes = image ? ['http', 'https'] : ['http', 'https', 'mailto', 'tel'];
		if (!schemes.includes(normalized.slice(0, colon))) return null;
		return decoded;
	}
	return null;
}

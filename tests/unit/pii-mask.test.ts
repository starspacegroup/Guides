import { describe, expect, it } from 'vitest';
import {
	isPiiRevealed,
	maskEmail,
	maskGeneric,
	maskName,
	PII_REVEAL_COOKIE
} from '$lib/server/pii-mask';

describe('PII masking', () => {
	it('masks names and keeps single-letter words intact', () => {
		expect(maskName('Member One')).toBe('M***** O**');
		expect(maskName('A B')).toBe('A B');
		expect(maskName(null)).toBe('*** ***');
		expect(maskName('')).toBe('*** ***');
	});

	it('masks the local part of an address and keeps the domain', () => {
		expect(maskEmail('member@example.com')).toBe('m*****@example.com');
		expect(maskEmail('ab@example.com')).toBe('a**@example.com');
		expect(maskEmail('@example.com')).toBe('@***********');
		expect(maskEmail('not-an-address')).toBe('n*************');
		expect(maskEmail(null)).toBe('***@***.***');
	});

	it('masks generic identifiers by length', () => {
		expect(maskGeneric('4815162342')).toBe('48******42');
		expect(maskGeneric('abcd')).toBe('a***');
		expect(maskGeneric(null)).toBe('***');
	});

	it('reveals PII only for an owner holding the reveal cookie', () => {
		expect(isPiiRevealed({ isOwner: true }, '1')).toBe(true);
		expect(isPiiRevealed({ isOwner: true }, undefined)).toBe(false);
		expect(isPiiRevealed({ isOwner: false, isAdmin: true }, '1')).toBe(false);
		expect(isPiiRevealed(null, '1')).toBe(false);
		expect(PII_REVEAL_COOKIE).toBe('pii_reveal');
	});
});

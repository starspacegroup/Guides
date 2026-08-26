/// <reference types="node" />

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const svgPath = resolve('static/og-image.svg');
const pngPath = resolve('static/og-image.png');

describe('share image assets', () => {
	it('keeps the SVG and rendered PNG at the declared social-card dimensions', () => {
		expect(existsSync(svgPath)).toBe(true);
		expect(existsSync(pngPath)).toBe(true);

		const svg = readFileSync(svgPath, 'utf8');
		const png = readFileSync(pngPath);

		expect(svg).toMatch(/viewBox=["']0 0 1200 630["']/);
		expect(png.subarray(0, 8)).toEqual(
			Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
		);
		expect(png.readUInt32BE(16)).toBe(1200);
		expect(png.readUInt32BE(20)).toBe(630);
	});
});

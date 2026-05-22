/// <reference types="node" />

import { existsSync, statSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const svgPath = resolve('static/og-image.svg');
const pngPath = resolve('static/og-image.png');

describe('share image assets', () => {
	it('keeps the rendered PNG at least as current as the SVG source', () => {
		expect(existsSync(svgPath)).toBe(true);
		expect(existsSync(pngPath)).toBe(true);

		const svgStats = statSync(svgPath);
		const pngStats = statSync(pngPath);

		expect(pngStats.mtimeMs).toBeGreaterThanOrEqual(svgStats.mtimeMs);
	});
});
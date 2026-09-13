import { describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../../src/routes/api/setup/+server';

describe('setup security', () => {
	it('fails closed when KV is unavailable', async () => {
		await expect(GET({} as any)).rejects.toMatchObject({ status: 500 });
	});

	it('requires the bootstrap secret before external lookup', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		await expect(
			POST({
				locals: {},
				request: new Request('http://localhost/api/setup', {
					method: 'POST',
					body: '{}'
				}),
				platform: { env: { SETUP_SECRET: 'secret', KV: { get: vi.fn().mockResolvedValue(null) } } }
			} as any)
		).rejects.toMatchObject({ status: 401 });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('does not replace any existing owner or configuration', async () => {
		await expect(
			POST({
				locals: {},
				request: new Request('http://localhost/api/setup'),
				platform: { env: { KV: { get: vi.fn().mockResolvedValue('existing') } } }
			} as any)
		).rejects.toMatchObject({ status: 401 });
	});
});

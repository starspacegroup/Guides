import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('CMS uploads API', () => {
	let mockLocals: any;
	let mockPlatform: any;

	beforeEach(() => {
		vi.resetModules();
		mockLocals = {
			user: {
				id: 'owner-1',
				login: 'owner',
				email: 'owner@example.com',
				isOwner: true,
				isAdmin: true
			}
		};
		mockPlatform = {
			env: {}
		};
	});

	it('requires authentication for uploads', async () => {
		const { POST } = await import('../../src/routes/api/cms/uploads/+server.js');

		await expect(
			POST({
				platform: mockPlatform,
				locals: { user: null },
				request: {
					formData: async () => new FormData()
				},
				url: new URL('http://localhost/api/cms/uploads')
			} as any)
		).rejects.toMatchObject({ status: 401 });
	});

	it('rejects uploads from non-admin users', async () => {
		const { POST } = await import('../../src/routes/api/cms/uploads/+server.js');

		await expect(
			POST({
				platform: mockPlatform,
				locals: {
					user: {
						...mockLocals.user,
						isOwner: false,
						isAdmin: false
					}
				},
				request: {
					formData: async () => new FormData()
				},
				url: new URL('http://localhost/api/cms/uploads')
			} as any)
		).rejects.toMatchObject({ status: 403 });
	});

	it('rejects non-image files', async () => {
		const { POST } = await import('../../src/routes/api/cms/uploads/+server.js');
		const formData = new FormData();
		formData.set('file', new File(['hello'], 'notes.txt', { type: 'text/plain' }));

		await expect(
			POST({
				platform: mockPlatform,
				locals: mockLocals,
				request: {
					formData: async () => formData
				},
				url: new URL('http://localhost/api/cms/uploads')
			} as any)
		).rejects.toMatchObject({ status: 400 });
	});

	it('rejects missing, empty, and oversized image files', async () => {
		const { POST } = await import('../../src/routes/api/cms/uploads/+server.js');
		const invoke = (formData: FormData) =>
			POST({
				platform: mockPlatform,
				locals: mockLocals,
				request: { formData: async () => formData },
				url: new URL('http://localhost/api/cms/uploads')
			} as any);
		await expect(invoke(new FormData())).rejects.toMatchObject({ status: 400 });
		const empty = new FormData();
		empty.set('file', new File([], 'empty.png', { type: 'image/png' }));
		await expect(invoke(empty)).rejects.toMatchObject({ status: 400 });
		const large = new FormData();
		large.set(
			'file',
			new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })
		);
		await expect(invoke(large)).rejects.toMatchObject({ status: 413 });
	});

	it('returns a data url when no media bucket is configured', async () => {
		const { POST } = await import('../../src/routes/api/cms/uploads/+server.js');
		const formData = new FormData();
		formData.set('file', new File(['png-data'], 'photo.png', { type: 'image/png' }));

		const response = await POST({
			platform: mockPlatform,
			locals: mockLocals,
			request: {
				formData: async () => formData
			},
			url: new URL('http://localhost/api/cms/uploads')
		} as any);

		const data = await response.json();
		expect(response.status).toBe(201);
		expect(data.storage).toBe('inline');
		expect(data.url).toMatch(/^data:image\/png;base64,/);
	});

	it('stores uploads in the configured media bucket and returns an API url', async () => {
		const bucketPut = vi.fn().mockResolvedValue(undefined);
		mockPlatform.env.MEDIA_BUCKET = {
			put: bucketPut
		};

		const { POST } = await import('../../src/routes/api/cms/uploads/+server.js');
		const formData = new FormData();
		formData.set('file', new File(['png-data'], 'photo.png', { type: 'image/png' }));

		const response = await POST({
			platform: mockPlatform,
			locals: mockLocals,
			request: {
				formData: async () => formData
			},
			url: new URL('http://localhost/api/cms/uploads')
		} as any);

		const data = await response.json();
		expect(response.status).toBe(201);
		expect(bucketPut).toHaveBeenCalledTimes(1);
		expect(data.storage).toBe('r2');
		expect(data.url).toMatch(/^http:\/\/localhost\/api\/cms\/uploads\//);
	});
});

describe('CMS uploads asset route', () => {
	it('returns not found when storage or object bodies are absent', async () => {
		const { GET } = await import('../../src/routes/api/cms/uploads/[...key]/+server.js');
		await expect(GET({ params: { key: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
		await expect(
			GET({
				params: { key: 'x' },
				platform: { env: { MEDIA_BUCKET: { get: vi.fn().mockResolvedValue(null) } } }
			} as any)
		).rejects.toMatchObject({ status: 404 });
		await expect(
			GET({
				params: { key: 'x' },
				platform: { env: { MEDIA_BUCKET: { get: vi.fn().mockResolvedValue({ body: null }) } } }
			} as any)
		).rejects.toMatchObject({ status: 404 });
	});

	it('forwards complete object HTTP metadata', async () => {
		const { GET } = await import('../../src/routes/api/cms/uploads/[...key]/+server.js');
		const response = await GET({
			params: { key: 'x' },
			platform: {
				env: {
					MEDIA_BUCKET: {
						get: vi.fn().mockResolvedValue({
							body: new Uint8Array([1]),
							arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1]).buffer),
							httpEtag: 'etag',
							httpMetadata: {
								contentType: 'image/png',
								cacheControl: 'max-age=1',
								contentDisposition: 'inline'
							}
						})
					}
				}
			}
		} as any);
		expect(response.headers.get('cache-control')).toBe('max-age=1');
		expect(response.headers.get('content-disposition')).toBe('inline');
	});

	it('returns uploaded image bytes from the media bucket', async () => {
		const { GET } = await import('../../src/routes/api/cms/uploads/[...key]/+server.js');
		const mockBody = new Uint8Array([137, 80, 78, 71]);
		const mockPlatform = {
			env: {
				MEDIA_BUCKET: {
					get: vi.fn().mockResolvedValue({
						body: mockBody,
						arrayBuffer: vi.fn().mockResolvedValue(mockBody.buffer),
						httpEtag: 'etag-1',
						httpMetadata: {
							contentType: 'image/png'
						}
					})
				}
			}
		};

		const response = await GET({
			platform: mockPlatform,
			params: { key: 'wysiwyg/photo.png' }
		} as any);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('image/png');
		expect(await response.arrayBuffer()).toEqual(mockBody.buffer);
	});
});

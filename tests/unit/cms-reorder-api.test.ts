import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('CMS reorder API', () => {
  let mockPlatform: any;
  let mockLocals: any;
  let mockDB: any;

  beforeEach(() => {
    vi.resetModules();
    mockDB = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      all: vi.fn(),
      run: vi.fn(),
      batch: vi.fn()
    };
    mockPlatform = { env: { DB: mockDB } };
    mockLocals = {
      user: {
        id: 'user-1',
        login: 'admin',
        email: 'admin@test.com',
        isOwner: true,
        isAdmin: true
      }
    };
  });

  it('rejects anonymous requests', async () => {
    const { POST } = await import('../../src/routes/api/cms/[type]/reorder/+server.js');

    try {
      await POST({
        platform: mockPlatform,
        locals: { user: null },
        params: { type: 'ui-patterns' },
        request: new Request('http://localhost/api/cms/ui-patterns/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemIds: ['item-1'] })
        })
      } as any);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.status).toBe(401);
    }
  });

  it('reorders content items for a content type', async () => {
    const { POST } = await import('../../src/routes/api/cms/[type]/reorder/+server.js');

    mockDB.first
      .mockResolvedValueOnce({
        id: 'ct-1',
        slug: 'ui-patterns',
        name: 'UI Patterns',
        fields: '[]',
        settings: '{}',
        icon: 'layout',
        sort_order: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      })
      .mockResolvedValueOnce({ count: 2 });
    mockDB.batch.mockResolvedValue([{ success: true }, { success: true }]);

    const response = await POST({
      platform: mockPlatform,
      locals: mockLocals,
      params: { type: 'ui-patterns' },
      request: new Request('http://localhost/api/cms/ui-patterns/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: ['item-2', 'item-1'] })
      })
    } as any);

    expect(response.status).toBe(200);
    expect(mockDB.batch).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it('rejects invalid reorder payloads', async () => {
    const { POST } = await import('../../src/routes/api/cms/[type]/reorder/+server.js');

    mockDB.first.mockResolvedValueOnce({
      id: 'ct-1',
      slug: 'ui-patterns',
      name: 'UI Patterns',
      fields: '[]',
      settings: '{}',
      icon: 'layout',
      sort_order: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    });

    try {
      await POST({
        platform: mockPlatform,
        locals: mockLocals,
        params: { type: 'ui-patterns' },
        request: new Request('http://localhost/api/cms/ui-patterns/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemIds: [] })
        })
      } as any);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.status).toBe(400);
    }
  });
});
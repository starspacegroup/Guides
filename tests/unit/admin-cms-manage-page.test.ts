import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AdminCmsManagePage from '../../src/routes/admin/cms/[type]/+page.svelte';

describe('Admin CMS manage page', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  const baseData = {
    contentType: {
      id: 'ct-ui-patterns',
      slug: 'ui-patterns',
      name: 'UI Patterns',
      description: 'Best practices for interaction patterns.',
      fields: [],
      settings: {
        isPublic: true,
        routePrefix: '/ui-patterns',
        hasDrafts: true,
        hasTags: false,
        hasSEO: true
      }
    },
    items: [
      {
        id: 'item-1',
        title: 'Modal Dialogs Must Control Focus and Provide Reliable Close Paths',
        slug: 'modal-dialog-focus-and-close-behavior',
        status: 'published',
        sortOrder: 0,
        createdAt: '2026-04-03T00:00:00.000Z',
        updatedAt: '2026-04-03T00:00:00.000Z',
        fields: {}
      },
      {
        id: 'item-2',
        title: 'Know When to Use a Tooltip Versus a Popover',
        slug: 'tooltip-vs-popover-when-to-use-which',
        status: 'published',
        sortOrder: 1,
        createdAt: '2026-04-03T00:00:00.000Z',
        updatedAt: '2026-04-03T00:00:00.000Z',
        fields: {}
      }
    ],
    tags: [],
    totalItems: 2,
    totalPages: 1,
    currentPage: 1,
    filters: { status: '', search: '' }
  };

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('links public item titles and adds a dedicated view action', () => {
    const { container } = render(AdminCmsManagePage, { props: { data: baseData as any } });

    const titleLink = screen
      .getByText(/modal dialogs must control focus and provide reliable close paths/i)
      .closest('a');
    expect(titleLink).toHaveAttribute('href', '/ui-patterns/modal-dialog-focus-and-close-behavior');

    const viewLink = container.querySelector(
      'a[aria-label="View Modal Dialogs Must Control Focus and Provide Reliable Close Paths"]'
    );
    expect(viewLink).toHaveAttribute('href', '/ui-patterns/modal-dialog-focus-and-close-behavior');
  });

  it('keeps private items as plain text without public view links', () => {
    const data = {
      ...baseData,
      contentType: {
        ...baseData.contentType,
        settings: {
          ...baseData.contentType.settings,
          isPublic: false
        }
      }
    };

    render(AdminCmsManagePage, { props: { data: data as any } });

    expect(
      screen.queryByRole('link', {
        name: /modal dialogs must control focus and provide reliable close paths/i
      })
    ).toBeNull();
    expect(screen.queryByRole('link', { name: /view modal dialogs must control focus/i })).toBeNull();
    expect(screen.getAllByText(/private content/i)).toHaveLength(2);
  });

  it('renders drag handles and drop slots for manual ordering', () => {
    const { container } = render(AdminCmsManagePage, { props: { data: baseData as any } });

    const sortableItems = container.querySelectorAll('[data-sortable-item]');
    expect(sortableItems).toHaveLength(2);

    expect(
      screen.getByRole('button', {
        name: /reorder modal dialogs must control focus and provide reliable close paths/i
      })
    ).toBeInTheDocument();
    expect(container.querySelectorAll('[data-drop-index]')).toHaveLength(3);
  });

  it('links create and edit actions to dedicated item editor routes', () => {
    const { container } = render(AdminCmsManagePage, { props: { data: baseData as any } });

    expect(screen.getByRole('link', { name: /new ui pattern/i })).toHaveAttribute(
      'href',
      '/admin/cms/ui-patterns/new'
    );

    const editLink = container.querySelector('a[href="/admin/cms/ui-patterns/item-1"]');
    expect(editLink).toHaveAttribute('href', '/admin/cms/ui-patterns/item-1');
  });
});
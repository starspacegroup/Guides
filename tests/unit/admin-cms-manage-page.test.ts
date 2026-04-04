import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import AdminCmsManagePage from '../../src/routes/admin/cms/[type]/+page.svelte';

describe('Admin CMS manage page', () => {
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
        createdAt: '2026-04-03T00:00:00.000Z',
        updatedAt: '2026-04-03T00:00:00.000Z',
        fields: {}
      }
    ],
    tags: [],
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    filters: { status: '', search: '' }
  };

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
    expect(screen.getByText(/private content/i)).toBeInTheDocument();
  });
});
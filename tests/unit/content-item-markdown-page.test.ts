import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentItemParsed, ContentTagParsed, ContentTypeParsed } from '../../src/lib/cms/types';
import Page from '../../src/routes/[contentType]/[slug]/+page.svelte';

function createContentType(overrides: Partial<ContentTypeParsed> = {}): ContentTypeParsed {
  return {
    id: 'content-type-1',
    slug: 'ui-patterns',
    name: 'UI Patterns',
    description: 'Guides for reusable UI patterns',
    fields: [],
    settings: {
      itemTemplate: 'blog-item',
      routePrefix: '/ui-patterns',
      hasTags: false
    },
    icon: 'article',
    sortOrder: 0,
    isSystem: true,
    purpose: 'guide_section',
    submissionPolicy: 'trusted_members',
    visibility: 'public',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides
  };
}

function createContentItem(overrides: Partial<ContentItemParsed> = {}): ContentItemParsed {
  return {
    id: 'item-1',
    contentTypeId: 'content-type-1',
    slug: 'theme-toggle-icons-should-signal-the-next-action',
    title: 'Theme Toggle Icons Should Signal the Next Action',
    status: 'published',
    fields: {},
    seoTitle: null,
    seoDescription: null,
    seoImage: null,
    authorId: null,
    publishedAt: '2026-04-03T00:00:00.000Z',
    sortOrder: 0,
    createdAt: '2026-04-03T00:00:00.000Z',
    updatedAt: '2026-04-03T00:00:00.000Z',
    ...overrides
  };
}

function createTag(overrides: Partial<ContentTagParsed> = {}): ContentTagParsed {
  return {
    id: 'tag-1',
    contentTypeId: 'content-type-1',
    name: 'Forms',
    slug: 'forms',
    createdAt: '2026-04-03T00:00:00.000Z',
    ...overrides
  };
}

function createPageData(overrides: {
  contentType: ContentTypeParsed;
  item: ContentItemParsed;
  tags: ContentTagParsed[];
}) {
  return {
    user: null,
    hasAIProviders: false,
    guideCollections: [],
    ...overrides
  };
}

describe('Content item page markdown rendering', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
  });

  it('renders markdown body inside the editorial blog-item layout', () => {
    const { container } = render(Page, {
      props: {
        data: createPageData({
          contentType: createContentType({
            slug: 'ui-feedback-and-states',
            name: 'UI Feedback and States',
            description: 'Guides for feedback states',
            settings: {
              itemTemplate: 'blog-item',
              routePrefix: '/ui-feedback-and-states',
              hasTags: false
            }
          }),
          item: createContentItem({
            title: 'Validation Feedback Must Fire at the Right Time',
            slug: 'validation-feedback-must-fire-at-the-right-time',
            publishedAt: '2026-04-03T00:00:00.000Z',
            fields: {
              category: 'Forms',
              excerpt: 'Validation should respond at intentional moments instead of firing prematurely.',
              body:
                '# Rule\n\n## Why\n\nValidation should wait until the user has context.\n\n### Must\n\n- After blur\n- On submit',
              read_time: 6
            }
          }),
          tags: [createTag()]
        })
      }
    });

    expect(container.querySelector('.cms-item-shell')).toBeTruthy();
    expect(container.querySelector('.cms-blog-article-main')).toBeTruthy();
    expect(container.querySelector('.cms-blog-article-intro')).toBeTruthy();
    expect(container.querySelector('.cms-blog-article-main')?.classList.contains('no-hero')).toBe(true);
    expect(container.querySelector('.cms-blog-article-main')?.classList.contains('has-hero')).toBe(false);
    expect(container.querySelector('.cms-blog-article-hero')).toBeFalsy();
    expect(container.querySelector('.cms-article-toc')).toBeTruthy();
    expect(container.querySelector('.cms-article-sidebar')?.getAttribute('aria-label')).toBe('Code examples');
    expect(container.querySelector('.cms-article-toc-label')?.textContent).toContain('Code examples');
    expect(container.querySelector('.cms-article-toc a[href="#why"]')?.textContent).toContain('Why');
    expect(container.querySelector('.cms-article-toc a[href="#must"]')?.textContent).toContain('Must');

    const content = container.querySelector('.cms-content');
    expect(content?.innerHTML).toContain('<h1 id="rule">Rule</h1>');
    expect(content?.innerHTML).toContain('<h2 id="why">Why</h2>');
    expect(content?.innerHTML).toContain('<h3 id="must">Must</h3>');
    expect(content?.innerHTML).toContain('<ul>');
    expect(content?.textContent).toContain('After blur');
    expect(content?.textContent).not.toContain('# Rule');

    expect(container.querySelector('.cms-blog-article-excerpt')?.textContent).toContain(
      'Validation should respond at intentional moments'
    );
    expect(container.querySelector('.cms-tag')?.textContent).toContain('Forms');
  });

  it('copies rendered code blocks from the article body', async () => {
    render(Page, {
      props: {
        data: createPageData({
          contentType: createContentType(),
          item: createContentItem({
            fields: {
              excerpt: 'Theme toggles should show the next action.',
              body: '# Code Examples\n\n```ts\nconst nextTheme = currentTheme === "light" ? "dark" : "light";\n```',
              read_time: 6
            }
          }),
          tags: []
        })
      }
    });

    const copyButton = await screen.findByRole('button', { name: 'Copy TypeScript code' });
    await fireEvent.click(copyButton);

    expect(globalThis.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'const nextTheme = currentTheme === "light" ? "dark" : "light";'
    );
  });

  it('renders a working header demo when the guide defines one', async () => {
    const { container } = render(Page, {
      props: {
        data: createPageData({
          contentType: createContentType(),
          item: createContentItem({
            fields: {
              excerpt: 'Theme toggles should show the next action.',
              header_demo: 'theme-toggle-next-action',
              body: '# Code Examples\n\n## Svelte\n\nUse the next theme icon.',
              read_time: 6
            }
          }),
          tags: []
        })
      }
    });

    expect(container.querySelector('.cms-blog-article-header-demo')).toBeTruthy();
    expect(container.querySelector('[data-header-demo="theme-toggle-next-action"]')).toBeTruthy();
    expect(container.querySelector('[data-preview-theme="light"]')).toBeTruthy();

    const toggleButton = screen.getByRole('button', { name: 'Switch to dark mode' });

    await fireEvent.click(toggleButton);

    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
    expect(container.querySelector('[data-preview-theme="dark"]')).toBeTruthy();
  });

  it('shows an admin edit link on the frontend for admin users', () => {
    render(Page, {
      props: {
        data: {
          ...createPageData({
            contentType: createContentType(),
            item: createContentItem(),
            tags: []
          }),
          user: {
            id: 'admin-user',
            login: 'admin',
            email: 'admin@example.com',
            isAdmin: true,
            isOwner: false
          }
        }
      }
    });

    expect(screen.getByRole('link', { name: /edit this guide/i })).toHaveAttribute(
      'href',
      '/admin/cms/ui-patterns/item-1'
    );
  });

  it('does not show the frontend edit link for non-admin users', () => {
    render(Page, {
      props: {
        data: {
          ...createPageData({
            contentType: createContentType(),
            item: createContentItem(),
            tags: []
          }),
          user: {
            id: 'member-user',
            login: 'member',
            email: 'member@example.com',
            isAdmin: false,
            isOwner: false
          }
        }
      }
    });

    expect(screen.queryByRole('link', { name: /edit this guide/i })).toBeNull();
  });

  it('updates the guide heading and document title when a new item is pushed into the same route component', async () => {
    const firstItem = createContentItem();
    const nextItem = createContentItem({
      id: 'item-2',
      slug: 'cancellation-flows-should-stay-self-serve',
      title: 'Cancellation Flows Should Stay Self-Serve',
      seoTitle: 'Cancellation Flows',
      updatedAt: '2026-04-04T00:00:00.000Z'
    });

    const { component, container } = render(Page, {
      props: {
        data: createPageData({
          contentType: createContentType(),
          item: firstItem,
          tags: []
        })
      }
    });

    expect(container.querySelector('h1')?.textContent).toContain(firstItem.title);
    expect(document.title).toBe('Theme Toggle Icons Should Signal the Next Action - Guides');

    component.$set({
      data: createPageData({
        contentType: createContentType(),
        item: nextItem,
        tags: []
      })
    });

    await tick();

    expect(container.querySelector('h1')?.textContent).toContain('Cancellation Flows Should Stay Self-Serve');
    expect(document.title).toBe('Cancellation Flows - Guides');
  });
});
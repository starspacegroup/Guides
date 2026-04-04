import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Page from '../../src/routes/[contentType]/[slug]/+page.svelte';

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
        data: {
          contentType: {
            slug: 'ui-feedback-and-states',
            name: 'UI Feedback and States',
            description: 'Guides for feedback states',
            fields: [],
            settings: {
              itemTemplate: 'blog-item',
              routePrefix: '/ui-feedback-and-states',
              hasTags: false
            }
          },
          item: {
            title: 'Validation Feedback Must Fire at the Right Time',
            seoTitle: null,
            seoDescription: null,
            seoImage: null,
            publishedAt: '2026-04-03T00:00:00.000Z',
            fields: {
              category: 'Forms',
              excerpt: 'Validation should respond at intentional moments instead of firing prematurely.',
              body:
                '# Rule\n\n## Why\n\nValidation should wait until the user has context.\n\n### Must\n\n- After blur\n- On submit',
              read_time: 6
            }
          },
          tags: [{ slug: 'forms', name: 'Forms' }]
        }
      }
    });

    expect(container.querySelector('.cms-item-shell')).toBeTruthy();
    expect(container.querySelector('.cms-blog-article-main')).toBeTruthy();
    expect(container.querySelector('.cms-blog-article-intro')).toBeTruthy();
    expect(container.querySelector('.cms-blog-article-main')?.classList.contains('no-hero')).toBe(true);
    expect(container.querySelector('.cms-blog-article-main')?.classList.contains('has-hero')).toBe(false);
    expect(container.querySelector('.cms-blog-article-hero')).toBeFalsy();
    expect(container.querySelector('.cms-article-toc')).toBeTruthy();
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
          data: {
            contentType: {
              slug: 'ui-patterns',
              name: 'UI Patterns',
              description: 'Guides for reusable UI patterns',
              fields: [],
              settings: {
                itemTemplate: 'blog-item',
                routePrefix: '/ui-patterns',
                hasTags: false
              }
            },
            item: {
              title: 'Theme Toggle Icons Should Signal the Next Action',
              seoTitle: null,
              seoDescription: null,
              seoImage: null,
              publishedAt: '2026-04-03T00:00:00.000Z',
              fields: {
                excerpt: 'Theme toggles should show the next action.',
                body: '# Code Examples\n\n```ts\nconst nextTheme = currentTheme === "light" ? "dark" : "light";\n```',
                read_time: 6
              }
            },
            tags: []
          }
        }
      });

      const copyButton = await screen.findByRole('button', { name: 'Copy TypeScript code' });
      await fireEvent.click(copyButton);

      expect(globalThis.navigator.clipboard.writeText).toHaveBeenCalledWith(
        'const nextTheme = currentTheme === "light" ? "dark" : "light";'
      );
    });
});
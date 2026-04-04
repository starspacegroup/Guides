import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from '../../src/routes/[contentType]/[slug]/+page.svelte';

describe('Content item page markdown rendering', () => {
  it('renders markdown body as HTML for blog-style content', () => {
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
              body: '# Rule\n\n- After blur\n- On submit',
              read_time: 6
            }
          },
          tags: []
        }
      }
    });

    const content = container.querySelector('.cms-content');
    expect(content?.innerHTML).toContain('<h1>Rule</h1>');
    expect(content?.innerHTML).toContain('<ul>');
    expect(content?.textContent).toContain('After blur');
    expect(content?.textContent).not.toContain('# Rule');
  });
});
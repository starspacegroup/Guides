import type { ContentTypeDefinition } from './types';

export const userInterfaceContentType: ContentTypeDefinition = {
  slug: 'user-interface',
  name: 'User Interface',
  description: 'Section guides for UI implementation details and design decisions',
  icon: 'layout',
  purpose: 'guide_section',
  submissionPolicy: 'trusted_members',
  visibility: 'public',
  fields: [
    {
      name: 'excerpt',
      label: 'Excerpt',
      type: 'textarea',
      required: true,
      placeholder: 'A short summary of this guide...',
      helpText: 'Shown on the section listing page',
      validation: { maxLength: 300 },
      sortOrder: 1
    },
    {
      name: 'body',
      label: 'Guide Body',
      type: 'richtext',
      required: true,
      helpText: 'The main guide content (supports Markdown)',
      sortOrder: 2
    },
    {
      name: 'header_demo',
      label: 'Header Demo',
      type: 'select',
      options: [{ label: 'Theme Toggle: Next Action', value: 'theme-toggle-next-action' }],
      helpText: 'Optional working component shown in the article header.',
      sortOrder: 3
    },
    {
      name: 'difficulty',
      label: 'Difficulty',
      type: 'select',
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' }
      ],
      defaultValue: 'beginner',
      sortOrder: 4
    },
    {
      name: 'read_time',
      label: 'Read Time (minutes)',
      type: 'number',
      placeholder: '8',
      helpText: 'Estimated reading time',
      validation: { min: 1, max: 240 },
      sortOrder: 5
    }
  ],
  settings: {
    hasDrafts: true,
    hasTags: true,
    hasSEO: true,
    hasAuthor: true,
    routePrefix: '/user-interface',
    listPageSize: 12,
    defaultSort: 'published_at',
    defaultSortDirection: 'desc',
    isPublic: true,
    listTemplate: 'blog-list',
    itemTemplate: 'blog-item'
  }
};

export const contentTypeRegistry: ContentTypeDefinition[] = [
  userInterfaceContentType
];

export function getContentTypeDefinition(slug: string): ContentTypeDefinition | undefined {
  return contentTypeRegistry.find((ct) => ct.slug === slug);
}

export function getRegisteredSlugs(): string[] {
  return contentTypeRegistry.map((ct) => ct.slug);
}

export function isRegisteredContentType(slug: string): boolean {
  return contentTypeRegistry.some((ct) => ct.slug === slug);
}

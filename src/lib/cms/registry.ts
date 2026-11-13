import type { ContentFieldDefinition, ContentTypeDefinition } from './types';

interface GuideSectionInput {
	slug: string;
	name: string;
	description: string;
	icon: string;
	/** Fields that only this section has, placed after the guide body. */
	extraFields?: ContentFieldDefinition[];
}

/**
 * Every guide section shares one shape: excerpt, body, difficulty, read time.
 * A section is therefore four facts, and a new one is a few lines here plus
 * Markdown files under `content/guides/<slug>/`.
 */
export function defineGuideSection(input: GuideSectionInput): ContentTypeDefinition {
	const fields: ContentFieldDefinition[] = [
		{
			name: 'excerpt',
			label: 'Excerpt',
			type: 'textarea',
			required: true,
			placeholder: 'A short summary of this guide...',
			helpText: 'Shown on the section listing page',
			validation: { maxLength: 300 }
		},
		{
			name: 'body',
			label: 'Guide Body',
			type: 'richtext',
			required: true,
			helpText: 'The main guide content (supports Markdown)'
		},
		...(input.extraFields ?? []),
		{
			name: 'difficulty',
			label: 'Difficulty',
			type: 'select',
			options: [
				{ label: 'Beginner', value: 'beginner' },
				{ label: 'Intermediate', value: 'intermediate' },
				{ label: 'Advanced', value: 'advanced' }
			],
			defaultValue: 'beginner'
		},
		{
			name: 'read_time',
			label: 'Read Time (minutes)',
			type: 'number',
			placeholder: '8',
			helpText: 'Estimated reading time',
			validation: { min: 1, max: 240 }
		}
	];

	return {
		slug: input.slug,
		name: input.name,
		description: input.description,
		icon: input.icon,
		purpose: 'guide_section',
		submissionPolicy: 'trusted_members',
		visibility: 'public',
		fields: fields.map((field, index) => ({ ...field, sortOrder: index + 1 })),
		settings: {
			hasDrafts: true,
			hasTags: true,
			hasSEO: true,
			hasAuthor: true,
			routePrefix: `/${input.slug}`,
			listPageSize: 12,
			defaultSort: 'published_at',
			defaultSortDirection: 'desc',
			isPublic: true,
			listTemplate: 'blog-list',
			itemTemplate: 'blog-item'
		}
	};
}

export const userInterfaceContentType = defineGuideSection({
	slug: 'user-interface',
	name: 'User Interface',
	description: 'Section guides for UI implementation details and design decisions',
	icon: 'layout',
	extraFields: [
		{
			name: 'header_demo',
			label: 'Header Demo',
			type: 'select',
			options: [{ label: 'Theme Toggle: Next Action', value: 'theme-toggle-next-action' }],
			helpText: 'Optional working component shown in the article header.'
		}
	]
});

/**
 * Order is the order on the home page. `user-interface` stays first: it is the
 * section the site launched with, and tests and old links assume it.
 */
export const contentTypeRegistry: ContentTypeDefinition[] = [
	userInterfaceContentType,
	defineGuideSection({
		slug: 'cloudflare',
		name: 'Cloudflare',
		description: 'Pages, Workers, D1, KV and Durable Objects: the limits, the traps, and the guards that catch them',
		icon: 'cloud'
	}),
	defineGuideSection({
		slug: 'security',
		name: 'Auth & Security',
		description: 'Sessions, OAuth, secrets and access checks that fail closed',
		icon: 'shield'
	}),
	defineGuideSection({
		slug: 'reliability',
		name: 'Reliability',
		description: 'Retries, caches, timeouts and failure reports for software that tells the truth when things break',
		icon: 'pulse'
	}),
	defineGuideSection({
		slug: 'testing',
		name: 'Testing & Verification',
		description: 'Property tests, proofs, real databases and gates that actually gate',
		icon: 'check'
	}),
	defineGuideSection({
		slug: 'ai-agents',
		name: 'AI & Agents',
		description: 'Building features on language models, and working with coding agents without losing control',
		icon: 'sparkles'
	}),
	defineGuideSection({
		slug: 'discord',
		name: 'Discord',
		description: 'Bots, Activities and server administration for communities that run on Discord',
		icon: 'chat'
	}),
	defineGuideSection({
		slug: 'launch',
		name: 'Launch',
		description: 'Starting a project well and putting it in front of people: structure, copy, search and trust',
		icon: 'rocket'
	})
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

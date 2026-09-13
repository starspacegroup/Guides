/**
 * Guide visual identity
 *
 * Index cards carry no artwork of their own, so every guide in a section looked
 * identical: a title, a paragraph, a date. This derives a topic from what the
 * guide is actually about — title, slug, tags, summary — and hands the card a
 * motif, an accent colour, and a label to show instead.
 *
 * Deterministic and pure: the same guide always resolves to the same art, with
 * no database column to backfill and nothing for an author to fill in.
 */

export const guideTopicIds = [
	'command-palette',
	'keyboard',
	'tokens',
	'theming',
	'accessibility',
	'testing',
	'checklist',
	'security',
	'performance',
	'data',
	'forms',
	'feedback',
	'navigation',
	'layout',
	'deployment',
	'content',
	'ai',
	'general'
] as const;

export type GuideTopicId = (typeof guideTopicIds)[number];

export interface GuideTopic {
	id: GuideTopicId;
	/** Short human label, shown on the card chip. */
	label: string;
	/** Mid-tone hue. Mixed against surface/text at render time so it survives both themes. */
	accent: string;
	/** Which ink reads on top of `accent`, for glyphs drawn inside a filled accent shape. */
	ink: 'light' | 'dark';
	/**
	 * Words that mean this topic. A trailing `*` matches the rest of the word,
	 * so `test*` covers test, tests, testing, testable.
	 */
	keywords: string[];
}

/**
 * Ordered most specific first. Ties break toward the earlier entry, so
 * "Command Palette Accessibility" resolves to the palette rather than to the
 * broad accessibility topic — the palette is the subject, accessibility the
 * angle, and the angle still shows up as a secondary chip.
 */
export const guideTopics: readonly GuideTopic[] = [
	{
		id: 'command-palette',
		label: 'Command palette',
		accent: '#22d3ee',
		ink: 'dark',
		keywords: [
			'command palette',
			'commandpalette',
			'palette',
			'launcher',
			'quick action*',
			'omnibar',
			'spotlight',
			'cmd k',
			'command menu',
			'command runtime'
		]
	},
	{
		id: 'keyboard',
		label: 'Keyboard',
		accent: '#818cf8',
		ink: 'dark',
		keywords: [
			'keyboard',
			'shortcut*',
			'hotkey*',
			'keybinding*',
			'keypress',
			'key combo*',
			'chord*',
			'chording',
			'modifier key*'
		]
	},
	{
		id: 'tokens',
		label: 'Design tokens',
		accent: '#6366f1',
		ink: 'light',
		keywords: [
			'token*',
			'css variable*',
			'custom propert*',
			'design system',
			'design api',
			'scale',
			'palette token*',
			'semantic layer*',
			'naming convention*'
		]
	},
	{
		id: 'theming',
		label: 'Theming',
		accent: '#a855f7',
		ink: 'light',
		keywords: [
			'theme*',
			'theming',
			'dark mode',
			'light mode',
			'colour scheme',
			'color scheme',
			'appearance',
			'dark',
			'light'
		]
	},
	{
		id: 'accessibility',
		label: 'Accessibility',
		accent: '#10b981',
		ink: 'dark',
		keywords: [
			'accessib*',
			'a11y',
			'screen reader*',
			'aria',
			'wcag',
			'contrast',
			'focus management',
			'focus trap',
			'keyboard accessible',
			'assistive'
		]
	},
	{
		id: 'testing',
		label: 'Testing',
		accent: '#84cc16',
		ink: 'dark',
		keywords: [
			'test*',
			'regression*',
			'coverage',
			'vitest',
			'playwright',
			'unit test*',
			'e2e',
			'qa',
			'snapshot*',
			'fixture*'
		]
	},
	{
		id: 'checklist',
		label: 'Checklist',
		accent: '#14b8a6',
		ink: 'dark',
		keywords: [
			'checklist*',
			'hardening',
			'harden',
			'audit*',
			'review checklist',
			'standard*',
			'playbook',
			'runbook',
			'operator grade',
			'readiness'
		]
	},
	{
		id: 'security',
		label: 'Security',
		accent: '#f43f5e',
		ink: 'light',
		keywords: [
			'securit*',
			'auth',
			'authentication',
			'authorisation',
			'authorization',
			'login',
			'oauth',
			'session*',
			'permission*',
			'access polic*',
			'csrf',
			'xss',
			'secret*',
			'credential*'
		]
	},
	{
		id: 'performance',
		label: 'Performance',
		accent: '#f59e0b',
		ink: 'dark',
		keywords: [
			'performance',
			'perf',
			'optimi*',
			'speed',
			'fast',
			'latency',
			'bundle size',
			'lazy load*',
			'caching',
			'cache',
			'throughput',
			'first paint',
			'benchmark*'
		]
	},
	{
		id: 'data',
		label: 'Data',
		accent: '#3b82f6',
		ink: 'light',
		keywords: [
			'table*',
			'database*',
			'quer*',
			'sql',
			'd1',
			'migration*',
			'schema',
			'pagination',
			'sorting',
			'dataset*',
			'record*',
			'index*'
		]
	},
	{
		id: 'forms',
		label: 'Forms',
		accent: '#22c55e',
		ink: 'dark',
		keywords: [
			'form*',
			'input*',
			'validation',
			'validate',
			'field*',
			'inline edit*',
			'text area',
			'submit',
			'autocomplete'
		]
	},
	{
		id: 'feedback',
		label: 'Feedback',
		accent: '#fb923c',
		ink: 'dark',
		keywords: [
			'notification*',
			'toast*',
			'badge*',
			'alert*',
			'modal*',
			'dialog*',
			'tooltip*',
			'popover*',
			'banner*',
			'empty state*',
			'confirmation*'
		]
	},
	{
		id: 'navigation',
		label: 'Navigation',
		accent: '#d946ef',
		ink: 'light',
		keywords: [
			'navigation',
			'routing',
			'route*',
			'breadcrumb*',
			'menu*',
			'sidebar*',
			'url*',
			'deep link*',
			'redirect*',
			'wayfinding'
		]
	},
	{
		id: 'layout',
		label: 'Layout',
		accent: '#ec4899',
		ink: 'light',
		keywords: [
			'layout*',
			'responsive',
			'grid',
			'breakpoint*',
			'mobile',
			'spacing',
			'container quer*',
			'viewport*',
			'column*'
		]
	},
	{
		id: 'deployment',
		label: 'Deployment',
		accent: '#0ea5e9',
		ink: 'dark',
		keywords: [
			'deploy*',
			'cloudflare',
			'worker*',
			'pipeline*',
			'ci',
			'cd',
			'release*',
			'build*',
			'rollout*',
			'edge',
			'hosting',
			'infrastructure'
		]
	},
	{
		id: 'content',
		label: 'Content',
		accent: '#ca8a04',
		ink: 'dark',
		keywords: [
			'cms',
			'content',
			'markdown',
			'editor*',
			'publish*',
			'rich text',
			'author*',
			'copywriting',
			'documentation',
			'docs'
		]
	},
	{
		id: 'ai',
		label: 'AI',
		accent: '#c084fc',
		ink: 'dark',
		keywords: [
			'ai',
			'llm',
			'chat*',
			'model*',
			'prompt*',
			'agent*',
			'voice',
			'embedding*',
			'inference',
			'assistant*'
		]
	}
] as const;

const generalTopic: GuideTopic = {
	id: 'general',
	label: 'Guide',
	accent: '#7c3aed',
	ink: 'light',
	keywords: []
};

const topicsById = new Map<GuideTopicId, GuideTopic>(
	[...guideTopics, generalTopic].map((topic) => [topic.id, topic])
);

export function getGuideTopic(id: GuideTopicId): GuideTopic {
	return topicsById.get(id) ?? generalTopic;
}

/** `test*` -> /\btest[a-z0-9]*\b/, `css variable*` -> /\bcss variable[a-z0-9]*\b/ */
function compileKeyword(keyword: string): RegExp {
	const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const body = escaped.replace(/\\\*/g, '[a-z0-9]*');
	return new RegExp(`\\b${body}\\b`);
}

const compiledTopics = guideTopics.map((topic) => ({
	topic,
	patterns: topic.keywords.map((keyword) => ({
		regex: compileKeyword(keyword),
		/** Multi-word matches are a stronger signal than a single stray word. */
		weight: keyword.includes(' ') ? 2 : 1
	}))
}));

/** Lowercase, strip punctuation, collapse whitespace. Keeps `\b` matching honest. */
function normalise(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

export interface GuideVisualInput {
	title: string;
	slug?: string;
	/** Excerpt, SEO description, or whatever short summary the card shows. */
	summary?: string | null;
	tags?: readonly string[];
	/** The section the guide lives in, used as a weak hint. */
	contentTypeSlug?: string;
	contentTypeName?: string;
}

export interface GuideVisual {
	/** Drives the motif and the accent. */
	topic: GuideTopic;
	/** Other topics the guide clearly touches, strongest first. At most two. */
	secondary: GuideTopic[];
}

/** Title and slug say what a guide IS. A summary only says what it mentions. */
const PRIMARY_WEIGHT = 3;
const SECONDARY_WEIGHT = 1;
/** A section name shouldn't outvote the guide's own title. */
const SECTION_WEIGHT = 1;

/**
 * Score every topic against the guide's own words and keep the best.
 * Returns the general topic when nothing scores, so a card always has art.
 */
export function resolveGuideVisual(input: GuideVisualInput): GuideVisual {
	const primary = normalise(`${input.title} ${input.slug ?? ''}`);
	const secondary = normalise(`${input.summary ?? ''} ${(input.tags ?? []).join(' ')}`);
	const section = normalise(`${input.contentTypeSlug ?? ''} ${input.contentTypeName ?? ''}`);

	const scored = compiledTopics
		.map(({ topic, patterns }) => {
			let score = 0;
			for (const { regex, weight } of patterns) {
				if (regex.test(primary)) score += PRIMARY_WEIGHT * weight;
				if (regex.test(secondary)) score += SECONDARY_WEIGHT * weight;
				if (regex.test(section)) score += SECTION_WEIGHT * weight;
			}
			return { topic, score };
		})
		.filter((entry) => entry.score > 0);

	if (scored.length === 0) {
		return { topic: generalTopic, secondary: [] };
	}

	// Stable sort: equal scores keep guideTopics order, which runs specific first.
	scored.sort((a, b) => b.score - a.score);

	const [winner, ...rest] = scored;

	return {
		topic: winner.topic,
		// Only surface a second topic when it is a real signal, not one loose word.
		secondary: rest
			.filter((entry) => entry.score >= PRIMARY_WEIGHT)
			.slice(0, 2)
			.map((entry) => entry.topic)
	};
}

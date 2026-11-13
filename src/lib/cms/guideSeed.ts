/**
 * Guide seed builder
 *
 * Guides that ship with the site are written as Markdown files under
 * `content/guides/<section>/<NN>-<slug>.md` and turned into a D1 migration by
 * `scripts/build-guide-seed.ts`. This module is the pure part: parse a file,
 * check it, and write SQL that is safe to run twice.
 *
 * Each guide insert starts with a `-- guide: <section>/<slug>` marker. Applied
 * migrations are immutable, so the next seed migration reads those markers and
 * carries only the guides that no earlier migration has.
 */
import { generateSlug } from './utils';
import type { ContentTypeDefinition } from './types';

export const guideDifficulties = ['beginner', 'intermediate', 'advanced'] as const;
export type GuideDifficulty = (typeof guideDifficulties)[number];

export interface SeedGuide {
	section: string;
	slug: string;
	sortOrder: number;
	title: string;
	excerpt: string;
	description: string;
	difficulty: GuideDifficulty;
	readTime: number;
	tags: string[];
	body: string;
}

const PATH_PATTERN = /(?:^|\/)content\/guides\/([a-z0-9-]+)\/(\d+)-([a-z0-9-]+)\.md$/;
const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
const MARKER_PATTERN = /^-- guide: ([a-z0-9-]+\/[a-z0-9-]+)$/gm;
const WORDS_PER_MINUTE = 200;

export function estimateReadTime(body: string): number {
	const words = body.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function parseGuideFile(path: string, source: string): SeedGuide {
	const fail = (reason: string): never => {
		throw new Error(`${path}: ${reason}`);
	};

	const pathMatch = path.replaceAll('\\', '/').match(PATH_PATTERN);
	if (!pathMatch) {
		return fail('guide files live at content/guides/<section>/<NN>-<slug>.md');
	}
	const [, section, order, slug] = pathMatch;

	const fileMatch = source.replace(/\r\n?/g, '\n').match(FRONTMATTER_PATTERN);
	if (!fileMatch) {
		return fail('missing the --- frontmatter block');
	}

	const meta = new Map<string, string>();
	for (const line of fileMatch[1].split('\n')) {
		if (!line.trim()) continue;
		const pair = line.match(/^([a-z_]+):\s*(.*)$/);
		if (!pair) {
			return fail(`frontmatter line is not "key: value": ${line}`);
		}
		meta.set(pair[1], pair[2].trim());
	}

	const title = meta.get('title') || fail('frontmatter needs a title');
	const excerpt = meta.get('excerpt') || fail('frontmatter needs an excerpt');
	if (excerpt.length > 300) {
		fail('excerpt is over the 300 character limit of the section field');
	}

	const difficulty = (meta.get('difficulty') || 'intermediate') as GuideDifficulty;
	if (!guideDifficulties.includes(difficulty)) {
		fail(`difficulty must be one of ${guideDifficulties.join(', ')}`);
	}

	const body = fileMatch[2].trim();
	if (!body) {
		fail('the guide has no body');
	}
	// The renderer treats a literal backslash-n as a line break, because the
	// first seed migrations stored bodies that way. A code sample that contains
	// one would be split in two on the page.
	if (/\\[nr]/.test(body)) {
		fail(
			'body contains a literal backslash-n or backslash-r, which the renderer turns into a line break'
		);
	}

	const readTimeText = meta.get('read_time');
	const readTime = readTimeText ? Number(readTimeText) : estimateReadTime(body);
	if (!Number.isInteger(readTime) || readTime < 1) {
		fail('read_time must be a whole number of minutes');
	}

	return {
		section,
		slug,
		sortOrder: Number(order) * 10,
		title,
		excerpt,
		description: meta.get('description') || excerpt,
		difficulty,
		readTime,
		tags: (meta.get('tags') || '')
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean),
		body
	};
}

export function sqlString(value: string): string {
	return `'${value.replaceAll("'", "''")}'`;
}

export function findSeededGuideKeys(migrationSources: string[]): Set<string> {
	const keys = new Set<string>();
	for (const source of migrationSources) {
		for (const match of source.matchAll(MARKER_PATTERN)) {
			keys.add(match[1]);
		}
	}
	return keys;
}

const typeId = (section: string) =>
	`(SELECT id FROM content_types WHERE slug = ${sqlString(section)} LIMIT 1)`;

/**
 * The row matches what `syncContentTypes()` would write, so the first request
 * after the migration finds nothing to update.
 */
export function buildSectionSql(def: ContentTypeDefinition, sortOrder: number): string {
	return `INSERT INTO content_types (
	id, slug, name, description, fields, settings, icon, sort_order, is_system, purpose, submission_policy, visibility
)
SELECT
	lower(hex(randomblob(16))),
	${sqlString(def.slug)},
	${sqlString(def.name)},
	${sqlString(def.description)},
	${sqlString(JSON.stringify(def.fields))},
	${sqlString(JSON.stringify(def.settings))},
	${sqlString(def.icon)},
	${sortOrder},
	1,
	${sqlString(def.purpose || 'general')},
	${sqlString(def.submissionPolicy || 'admin_only')},
	${sqlString(def.visibility || 'public')}
WHERE NOT EXISTS (SELECT 1 FROM content_types WHERE slug = ${sqlString(def.slug)});`;
}

export function buildGuideSql(guide: SeedGuide): string {
	const type = typeId(guide.section);

	const statements = [
		`-- guide: ${guide.section}/${guide.slug}
INSERT INTO content_items (
	id, content_type_id, slug, title, status, fields, seo_title, seo_description, summary, editor_format, published_at, sort_order
)
SELECT
	lower(hex(randomblob(16))),
	${type},
	${sqlString(guide.slug)},
	${sqlString(guide.title)},
	'published',
	json_object(
		'excerpt', ${sqlString(guide.excerpt)},
		'body', ${sqlString(guide.body)},
		'difficulty', ${sqlString(guide.difficulty)},
		'read_time', ${guide.readTime}
	),
	${sqlString(guide.title)},
	${sqlString(guide.description)},
	${sqlString(guide.description)},
	'markdown',
	CURRENT_TIMESTAMP,
	${guide.sortOrder}
WHERE EXISTS (SELECT 1 FROM content_types WHERE slug = ${sqlString(guide.section)})
	AND NOT EXISTS (
		SELECT 1 FROM content_items
		WHERE content_type_id = ${type}
			AND slug = ${sqlString(guide.slug)}
	);`
	];

	for (const tag of guide.tags) {
		statements.push(
			`INSERT OR IGNORE INTO content_item_tags (content_item_id, content_tag_id)
SELECT i.id, g.id
FROM content_types t
JOIN content_items i ON i.content_type_id = t.id AND i.slug = ${sqlString(guide.slug)}
JOIN content_tags g ON g.content_type_id = t.id AND g.slug = ${sqlString(generateSlug(tag))}
WHERE t.slug = ${sqlString(guide.section)};`
		);
	}

	return statements.join('\n\n');
}

/** One statement per section tag, written once however many guides carry it. */
export function buildTagSql(section: string, tag: string): string {
	const tagSlug = generateSlug(tag);
	return `INSERT INTO content_tags (id, content_type_id, name, slug)
SELECT lower(hex(randomblob(16))), t.id, ${sqlString(tag)}, ${sqlString(tagSlug)}
FROM content_types t
WHERE t.slug = ${sqlString(section)}
	AND NOT EXISTS (
		SELECT 1 FROM content_tags g WHERE g.content_type_id = t.id AND g.slug = ${sqlString(tagSlug)}
	);`;
}

export interface SeedMigrationInput {
	title: string;
	guides: SeedGuide[];
	sections: ContentTypeDefinition[];
	seeded: Set<string>;
}

export function buildSeedMigration(input: SeedMigrationInput): { sql: string; guideCount: number } {
	const pending = input.guides
		.filter((guide) => !input.seeded.has(`${guide.section}/${guide.slug}`))
		.sort((a, b) => a.section.localeCompare(b.section) || a.sortOrder - b.sortOrder);

	const sectionSql: string[] = [];
	for (const section of new Set(pending.map((guide) => guide.section))) {
		const index = input.sections.findIndex((def) => def.slug === section);
		if (index === -1) {
			throw new Error(`Section "${section}" has guides but is not in the content type registry`);
		}
		sectionSql.push(buildSectionSql(input.sections[index], index));
	}

	const seenTags = new Set<string>();
	const tagSql: string[] = [];
	for (const guide of pending) {
		for (const tag of guide.tags) {
			const key = `${guide.section}/${generateSlug(tag)}`;
			if (seenTags.has(key)) continue;
			seenTags.add(key);
			tagSql.push(buildTagSql(guide.section, tag));
		}
	}

	const sql = [
		`-- ${input.title}`,
		'-- Generated by scripts/build-guide-seed.ts from content/guides/. Do not edit by hand:',
		'-- change the Markdown source and generate the next migration instead.',
		'-- Every statement is guarded, so a row an editor already made is left alone.',
		...sectionSql,
		...tagSql,
		...pending.map(buildGuideSql)
	].join('\n\n');

	return { sql: `${sql}\n`, guideCount: pending.length };
}

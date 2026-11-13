import { describe, expect, it } from 'vitest';
import {
	buildGuideSql,
	buildSectionSql,
	buildSeedMigration,
	estimateReadTime,
	findSeededGuideKeys,
	parseGuideFile,
	sqlString
} from './guideSeed';
import { contentTypeRegistry } from './registry';

const source = `---
title: Bind Your Own D1: Never Reuse a Template Id
excerpt: Cloudflare binds by id, so a copied id attaches you to another database.
difficulty: intermediate
tags: Cloudflare, D1
---

# Rule

Bind by your own id.

\`\`\`ts
const it's = "quoted";
\`\`\`
`;

describe('parseGuideFile', () => {
	it('reads section, slug and order from the path and fields from frontmatter', () => {
		const guide = parseGuideFile('content/guides/cloudflare/03-bind-your-own-d1.md', source);

		expect(guide.section).toBe('cloudflare');
		expect(guide.slug).toBe('bind-your-own-d1');
		expect(guide.sortOrder).toBe(30);
		expect(guide.title).toBe('Bind Your Own D1: Never Reuse a Template Id');
		expect(guide.excerpt).toMatch(/^Cloudflare binds by id/);
		expect(guide.description).toBe(guide.excerpt);
		expect(guide.difficulty).toBe('intermediate');
		expect(guide.tags).toEqual(['Cloudflare', 'D1']);
		expect(guide.body.startsWith('# Rule')).toBe(true);
		expect(guide.body.endsWith('```')).toBe(true);
		expect(guide.readTime).toBe(1);
	});

	it('accepts an explicit description and read time, and defaults the rest', () => {
		const guide = parseGuideFile(
			'/abs/content/guides/testing/12-a.md',
			'---\ntitle: A\nexcerpt: B\ndescription: C\nread_time: 9\n---\nBody'
		);

		expect(guide.description).toBe('C');
		expect(guide.readTime).toBe(9);
		expect(guide.difficulty).toBe('intermediate');
		expect(guide.tags).toEqual([]);
		expect(guide.sortOrder).toBe(120);
	});

	it.each([
		['notes/readme.md', source, /content\/guides\/<section>\/<NN>-<slug>\.md/],
		['content/guides/x/01-a.md', 'no frontmatter', /frontmatter/],
		['content/guides/x/01-a.md', '---\nexcerpt: B\n---\nBody', /title/],
		['content/guides/x/01-a.md', '---\ntitle: A\n---\nBody', /excerpt/],
		['content/guides/x/01-a.md', `---\ntitle: A\nexcerpt: ${'x'.repeat(301)}\n---\nBody`, /300/],
		[
			'content/guides/x/01-a.md',
			'---\ntitle: A\nexcerpt: B\ndifficulty: wizard\n---\nBody',
			/difficulty/
		],
		[
			'content/guides/x/01-a.md',
			'---\ntitle: A\nexcerpt: B\nread_time: soon\n---\nBody',
			/read_time/
		],
		['content/guides/x/01-a.md', '---\ntitle: A\nexcerpt: B\n---\n  \n', /body/],
		['content/guides/x/01-a.md', '---\ntitle: A\nexcerpt: B\nnot a pair\n---\nBody', /not a pair/]
	])('rejects %s', (path, text, message) => {
		expect(() => parseGuideFile(path, text)).toThrow(message);
	});

	it('rejects a literal backslash-n, which the renderer would turn into a line break', () => {
		const text = '---\ntitle: A\nexcerpt: B\n---\nconsole.log("a\\nb")';
		expect(() => parseGuideFile('content/guides/x/01-a.md', text)).toThrow(/backslash/);
	});
});

describe('estimateReadTime', () => {
	it('rounds up at 200 words a minute with a floor of one', () => {
		expect(estimateReadTime('')).toBe(1);
		expect(estimateReadTime(Array(200).fill('w').join(' '))).toBe(1);
		expect(estimateReadTime(Array(201).fill('w').join(' '))).toBe(2);
	});
});

describe('sqlString', () => {
	it('doubles single quotes', () => {
		expect(sqlString("it's")).toBe("'it''s'");
	});
});

describe('findSeededGuideKeys', () => {
	it('collects the markers earlier migrations left behind', () => {
		const keys = findSeededGuideKeys([
			'-- guide: cloudflare/a\nINSERT ...;\n-- guide: testing/b\n',
			'-- nothing here'
		]);
		expect([...keys].sort()).toEqual(['cloudflare/a', 'testing/b']);
	});
});

describe('SQL builders', () => {
	const guide = parseGuideFile('content/guides/cloudflare/03-bind-your-own-d1.md', source);

	it('writes an idempotent section insert that matches the registry JSON', () => {
		const def = contentTypeRegistry[0];
		const sql = buildSectionSql(def, 4);

		expect(sql).toContain(`'${def.slug}'`);
		expect(sql).toContain(sqlString(JSON.stringify(def.fields)));
		expect(sql).toContain(sqlString(JSON.stringify(def.settings)));
		expect(sql).toContain(
			"WHERE NOT EXISTS (SELECT 1 FROM content_types WHERE slug = 'user-interface')"
		);
		expect(sql).toMatch(/\t4,\n\t1,/);
	});

	it('falls back to the default policy fields when a definition omits them', () => {
		const { purpose, visibility, submissionPolicy, ...bare } = contentTypeRegistry[0];
		const sql = buildSectionSql(bare, 0);
		expect(sql).toContain("'general',\n\t'admin_only',\n\t'public'");
	});

	it('writes a marked, guarded guide insert with escaped body and its tags', () => {
		const sql = buildGuideSql(guide);

		expect(sql.startsWith('-- guide: cloudflare/bind-your-own-d1\n')).toBe(true);
		expect(sql).toContain("it''s");
		expect(sql).toContain("'published'");
		expect(sql).toContain("AND slug = 'bind-your-own-d1'");
		expect(sql).toContain("'Cloudflare',\n\t'cloudflare'");
		expect(sql).toContain("'D1',\n\t'd1'");
		expect(sql).toContain('INSERT OR IGNORE INTO content_item_tags');
		expect(sql.match(/INSERT INTO content_tags/g)).toHaveLength(2);
	});

	it('assembles a migration from only the guides no earlier migration seeded', () => {
		const other = parseGuideFile(
			'content/guides/user-interface/11-b.md',
			'---\ntitle: B\nexcerpt: E\n---\nBody'
		);
		const result = buildSeedMigration({
			title: 'Seed things',
			guides: [guide, other],
			sections: contentTypeRegistry,
			seeded: new Set(['user-interface/b'])
		});

		expect(result.guideCount).toBe(1);
		expect(result.sql.startsWith('-- Seed things\n')).toBe(true);
		expect(result.sql).toContain('-- guide: cloudflare/bind-your-own-d1');
		expect(result.sql).not.toContain('-- guide: user-interface/b');
	});

	it('refuses a guide whose section is not in the registry', () => {
		expect(() =>
			buildSeedMigration({ title: 'T', guides: [guide], sections: [], seeded: new Set() })
		).toThrow(/cloudflare/);
	});
});

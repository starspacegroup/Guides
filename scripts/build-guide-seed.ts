/**
 * Turn the Markdown guides under content/guides/ into the next D1 migration.
 *
 *   bun scripts/build-guide-seed.ts <name> ["Title line"]
 *   bun scripts/build-guide-seed.ts seed_more_cloudflare_guides
 *   bun scripts/build-guide-seed.ts --check
 *
 * Only guides that no earlier migration seeded are written, so the command is
 * safe to run after every batch of new files. `--check` parses every guide and
 * writes nothing; it fails on a bad file or an unknown section.
 *
 * The parsing and SQL live in src/lib/cms/guideSeed.ts, where they are tested.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeedMigration, findSeededGuideKeys, parseGuideFile } from '../src/lib/cms/guideSeed';
import { contentTypeRegistry } from '../src/lib/cms/registry';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'content', 'guides');
const migrationsDir = join(root, 'migrations');

const [nameArg, titleArg] = process.argv.slice(2);
if (!nameArg || (nameArg !== '--check' && !/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(nameArg))) {
	console.error(
		'usage: bun scripts/build-guide-seed.ts <snake_case_name> ["Title line"] | --check'
	);
	process.exit(2);
}

const guides = readdirSync(contentDir, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.flatMap((section) =>
		readdirSync(join(contentDir, section.name))
			.filter((file) => file.endsWith('.md'))
			.map((file) => `content/guides/${section.name}/${file}`)
	)
	.map((path) => parseGuideFile(path, readFileSync(join(root, path), 'utf8')));

const slugs = new Set<string>();
for (const guide of guides) {
	const key = `${guide.section}/${guide.slug}`;
	if (slugs.has(key)) {
		console.error(`duplicate guide slug: ${key}`);
		process.exit(1);
	}
	slugs.add(key);
}

const migrationFiles = readdirSync(migrationsDir)
	.filter((file) => /^\d{4}_.*\.sql$/.test(file))
	.sort();
const seeded = findSeededGuideKeys(
	migrationFiles.map((file) => readFileSync(join(migrationsDir, file), 'utf8'))
);

const title = titleArg || 'Seed guides from content/guides/';
const { sql, guideCount } = buildSeedMigration({
	title,
	guides,
	sections: contentTypeRegistry,
	seeded
});

if (nameArg === '--check') {
	console.log(`${guides.length} guides parse; ${guideCount} not yet in a migration.`);
	process.exit(0);
}

if (guideCount === 0) {
	console.log('Every guide is already in a migration. Nothing written.');
	process.exit(0);
}

const next = Number(migrationFiles.at(-1)?.slice(0, 4) ?? '0') + 1;
const file = `${String(next).padStart(4, '0')}_${nameArg}.sql`;
writeFileSync(join(migrationsDir, file), sql);
console.log(`migrations/${file}: ${guideCount} guides`);

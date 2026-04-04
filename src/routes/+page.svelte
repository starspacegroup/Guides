<script lang="ts">
	import SharingMeta from '$lib/components/SharingMeta.svelte';
	import { contentTypeRegistry } from '$lib/cms/registry';

	const collectionLabels: Record<string, string> = {
		article: 'Editorial collection',
		layout: 'Product systems'
	};

	const guideTypes = contentTypeRegistry
		.filter((contentType) => contentType.settings.isPublic)
		.map((contentType, index) => ({
			name: contentType.name,
			description: contentType.description,
			href: contentType.settings.routePrefix,
			label: collectionLabels[contentType.icon] ?? 'Guide collection',
			highlights: [
				`${contentType.fields.length} structured sections`,
				contentType.settings.hasTags ? 'Tagged for browsing' : 'Single stream',
				contentType.settings.hasAuthor ? 'Published with bylines' : 'Team-authored'
			],
			accent: index % 2 === 0 ? 'aurora' : 'signal'
		}));
</script>

<SharingMeta
	title="Guides"
	description="Browse software guide collections from the team at *Space on guides.starspace.group"
	image="/og-image.png"
	imageAlt="Guides by *Space"
	imageWidth={1200}
	imageHeight={630}
/>

<section class="landing">
	<div class="hero">
		<div class="hero-copy">
			<p class="eyebrow">guides.starspace.group</p>
			<h1>Software guides for the systems *Space ships</h1>
			<p class="lede">
				Browse the guide library by topic, with public collections for release notes, product
				updates, and detailed user interface decisions.
			</p>
			<div class="actions">
				<a class="button primary" href="#guide-types">Browse Guide Types</a>
				<a class="button" href="/auth/login">Sign In</a>
			</div>
		</div>

		<div class="hero-panel">
			<p class="panel-label">Inside the library</p>
			<ul class="panel-list">
				<li>Topic-specific collections with their own landing pages</li>
				<li>Clean route structure for sharing and discovery</li>
				<li>Consistent formats for long-form guides and updates</li>
			</ul>
		</div>
	</div>

	<section class="guide-types" id="guide-types" aria-label="Guide types">
		<div class="section-copy">
			<p class="section-label">Guide Types</p>
			<p class="section-title">Browse the collections currently available on the site.</p>
		</div>

		<div class="card-grid">
			{#each guideTypes as guideType}
				<article class={`guide-card ${guideType.accent}`}>
					<div class="card-header">
						<p class="card-label">{guideType.label}</p>
						<code>{guideType.href}</code>
					</div>
					<h2>{guideType.name}</h2>
					<p class="card-description">{guideType.description}</p>
					<ul class="card-highlights" aria-label={`${guideType.name} highlights`}>
						{#each guideType.highlights as highlight}
							<li>{highlight}</li>
						{/each}
					</ul>
					<a class="card-link" href={guideType.href} aria-label={`Browse ${guideType.name}`}>
						Browse {guideType.name}
					</a>
				</article>
			{/each}
		</div>
	</section>
</section>

<style>
	.landing {
		max-width: 1100px;
		margin: 0 auto;
		padding: var(--spacing-2xl) var(--spacing-md);
		display: grid;
		gap: var(--spacing-2xl);
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
		gap: var(--spacing-lg);
		padding: var(--spacing-2xl);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background:
			radial-gradient(circle at 10% 10%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 45%),
			radial-gradient(circle at 90% 20%, color-mix(in srgb, var(--color-secondary) 12%, transparent), transparent 40%),
			var(--color-surface);
	}

	.hero-copy {
		display: grid;
		align-content: start;
	}

	.eyebrow {
		margin: 0 0 var(--spacing-sm);
		font-size: 0.85rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	h1 {
		margin: 0 0 var(--spacing-md);
		font-size: clamp(2rem, 4vw, 3rem);
		line-height: 1.15;
	}

	.lede {
		margin: 0;
		max-width: 70ch;
		color: var(--color-text-secondary);
		line-height: 1.65;
	}

	.hero-panel {
		align-self: stretch;
		padding: var(--spacing-lg);
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-background) 40%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-border) 85%, var(--color-primary));
	}

	.panel-label {
		margin: 0 0 var(--spacing-sm);
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.panel-list {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: var(--spacing-sm);
		line-height: 1.6;
	}

	.actions {
		display: flex;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-lg);
		flex-wrap: wrap;
	}

	.button {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-sm) var(--spacing-md);
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-background);
		font-weight: 600;
	}

	.button.primary {
		background: var(--color-primary);
		color: var(--color-background);
		border-color: var(--color-primary);
	}

	.guide-types {
		display: grid;
		gap: var(--spacing-lg);
	}

	.section-copy {
		display: grid;
		gap: var(--spacing-xs);
	}

	.section-label {
		margin: 0;
		font-size: 0.85rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.section-title {
		margin: 0;
		font-size: clamp(1.4rem, 2vw, 1.9rem);
		line-height: 1.25;
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: var(--spacing-md);
	}

	.guide-card {
		display: grid;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background:
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--color-surface) 88%, var(--color-background)) 0%,
				var(--color-surface) 100%
			),
			var(--color-surface);
		box-shadow: var(--shadow-sm);
	}

	.guide-card.aurora {
		background:
			radial-gradient(circle at top right, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 35%),
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--color-surface) 92%, var(--color-background)) 0%,
				var(--color-surface) 100%
			),
			var(--color-surface);
	}

	.guide-card.signal {
		background:
			radial-gradient(circle at top right, color-mix(in srgb, var(--color-secondary) 16%, transparent), transparent 35%),
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--color-surface) 92%, var(--color-background)) 0%,
				var(--color-surface) 100%
			),
			var(--color-surface);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.card-label {
		margin: 0;
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.guide-card h2 {
		margin: 0;
		font-size: 1.35rem;
		line-height: 1.2;
	}

	.card-description {
		margin: 0;
		line-height: 1.65;
		color: var(--color-text-secondary);
	}

	.card-highlights {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.card-highlights li {
		padding: 0.35rem 0.65rem;
		border-radius: var(--radius-pill, 999px);
		background: color-mix(in srgb, var(--color-background) 65%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-border) 88%, var(--color-primary));
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.card-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: fit-content;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		text-decoration: none;
		font-weight: 600;
		color: var(--color-text);
		background: color-mix(in srgb, var(--color-background) 78%, var(--color-surface));
	}

	code {
		width: fit-content;
		padding: 0.15rem 0.4rem;
		border-radius: var(--radius-sm);
		background: var(--color-background);
		border: 1px solid var(--color-border);
	}

	@media (max-width: 700px) {
		.hero {
			grid-template-columns: 1fr;
			padding: var(--spacing-lg);
		}

		.card-header {
			align-items: flex-start;
		}
	}
</style>

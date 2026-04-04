<script lang="ts">
	import SharingMeta from '$lib/components/SharingMeta.svelte';
	import type { PublicGuideCollection } from '$lib/cms/types';

	export let data: {
		guideCollections?: PublicGuideCollection[];
	} = {};

	const collectionLabels: Record<string, string> = {
		article: 'Editorial collection',
		layout: 'Product systems'
	};

	const libraryFacts = [
		{
			title: 'Curated collections',
			copy: 'Each topic groups together the patterns, principles, and reference guides worth reusing.'
		},
		{
			title: 'Real product patterns',
			copy: 'The library captures practical approaches shaped by shipped interfaces, workflows, and systems.'
		},
		{
			title: 'Shareable references',
			copy: 'Every collection and guide keeps a direct URL so teams can revisit, cite, and build on the work.'
		}
	] as const;

	$: guideTypes = (data.guideCollections || []).map((guideCollection, index) => ({
		...guideCollection,
		label: collectionLabels[guideCollection.icon] ?? 'Guide collection',
		countLabel: `${guideCollection.publishedCount} published guides`,
		previewItems: guideCollection.items.slice(0, 2),
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
				Explore a curated library of practical guidance for building the future of software,
				from interface patterns to product decisions and release-ready systems.
			</p>
			<div class="actions">
				<a class="button primary" href="#guide-types">Browse Guide Types</a>
				<a class="button" href="/auth/login">Sign In</a>
			</div>
		</div>

		<div class="hero-panel">
			<p class="panel-label">Library structure</p>
			<h2 class="panel-title">What you'll find here</h2>
			<p class="panel-copy">
				Each collection brings together working patterns, product decisions, and
				implementation guidance intended to help teams build better software on purpose.
			</p>
			<dl class="panel-facts">
				{#each libraryFacts as fact}
					<div class="panel-fact">
						<dt>{fact.title}</dt>
						<dd>{fact.copy}</dd>
					</div>
				{/each}
			</dl>
		</div>
	</div>

	<section class="guide-types" id="guide-types" aria-label="Guide types">
		<div class="section-copy">
			<p class="section-label">Guide Types</p>
			<p class="section-title">Browse the collections currently available on the site.</p>
		</div>

		{#if guideTypes.length > 0}
			<div class="card-grid">
				{#each guideTypes as guideType}
					<article class={`guide-card ${guideType.accent}`}>
						<div class="card-header">
							<p class="card-label">{guideType.label}</p>
							<a class="card-meta-link" href={guideType.href}>View collection</a>
						</div>
						<h2>
							<a class="card-title-link" href={guideType.href}>{guideType.name}</a>
						</h2>
					<p class="card-description">{guideType.description}</p>
					<ul class="card-highlights" aria-label={`${guideType.name} highlights`}>
						<li class="count-pill">{guideType.countLabel}</li>
						{#each guideType.previewItems as item}
							<li>
								<a class="highlight-link" href={item.href}>{item.title}</a>
							</li>
						{/each}
					</ul>
					<a class="card-link" href={guideType.href} aria-label={`Browse ${guideType.name}`}>
						Browse {guideType.name}
					</a>
					</article>
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<p class="empty-title">Published guide collections will appear here.</p>
				<p class="empty-copy">
					Once guides are published, this page will surface the live collections instead of
					placeholder sections.
				</p>
			</div>
		{/if}
	</section>
</section>

<style>
	.landing {
		width: min(100%, 1560px);
		margin: 0 auto;
		padding: var(--spacing-lg) var(--spacing-sm) var(--spacing-2xl);
		display: grid;
		gap: var(--spacing-lg);
	}

	.hero {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background:
			radial-gradient(circle at 10% 10%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 45%),
			radial-gradient(circle at 90% 20%, color-mix(in srgb, var(--color-secondary) 12%, transparent), transparent 40%),
			var(--color-surface);
		overflow: hidden;
	}

	.hero-copy {
		display: grid;
		align-content: start;
		gap: var(--spacing-sm);
	}

	.eyebrow {
		margin: 0 0 var(--spacing-sm);
		font-size: 0.85rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	h1 {
		margin: 0;
		font-size: clamp(1.85rem, 9vw, 3.25rem);
		line-height: 1.05;
		max-width: 12ch;
	}

	.lede {
		margin: 0;
		max-width: 38ch;
		color: var(--color-text-secondary);
		line-height: 1.55;
	}

	.hero-panel {
		align-self: start;
		display: grid;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-background) 40%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-border) 85%, var(--color-primary));
		box-shadow: var(--shadow-sm);
	}

	.panel-label {
		margin: 0;
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.panel-title {
		margin: 0;
		font-size: clamp(1.2rem, 4vw, 1.8rem);
		line-height: 1.15;
		max-width: 14ch;
	}

	.panel-copy {
		margin: 0;
		color: var(--color-text-secondary);
		line-height: 1.6;
	}

	.panel-facts {
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--spacing-sm);
	}

	.panel-fact {
		padding-top: var(--spacing-sm);
		border-top: 1px solid color-mix(in srgb, var(--color-border) 92%, var(--color-primary));
	}

	.panel-fact dt {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.panel-fact dd {
		margin: var(--spacing-xs) 0 0;
		color: var(--color-text-secondary);
		line-height: 1.55;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.button {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		min-height: 2.75rem;
		width: 100%;
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
		font-size: clamp(1.3rem, 6vw, 2.25rem);
		line-height: 1.25;
		max-width: 18ch;
	}

	.card-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-md);
	}

	.guide-card {
		display: grid;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
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
		align-items: flex-start;
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

	.card-meta-link {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.guide-card h2 {
		margin: 0;
		font-size: 1.2rem;
		line-height: 1.2;
	}

	.card-title-link {
		color: var(--color-text);
		text-decoration: none;
	}

	.card-title-link:hover,
	.card-meta-link:hover,
	.highlight-link:hover {
		color: var(--color-primary);
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
		font-size: 0.82rem;
		line-height: 1.4;
	}

	.card-highlights li.count-pill {
		font-weight: 600;
	}

	.highlight-link {
		display: inline-flex;
		color: var(--color-text);
		text-decoration: none;
	}

	.card-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 2.75rem;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		text-decoration: none;
		font-weight: 600;
		color: var(--color-text);
		background: color-mix(in srgb, var(--color-background) 78%, var(--color-surface));
	}

	.empty-state {
		padding: var(--spacing-lg);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-surface) 90%, var(--color-background));
	}

	.empty-title {
		margin: 0 0 var(--spacing-xs);
		font-weight: 600;
	}

	.empty-copy {
		margin: 0;
		color: var(--color-text-secondary);
	}

	@media (min-width: 700px) {
		.landing {
			padding: var(--spacing-xl) var(--spacing-md) var(--spacing-2xl);
			gap: var(--spacing-xl);
		}

		.hero {
			padding: var(--spacing-lg);
		}

		.actions {
			flex-direction: row;
		}

		.button,
		.card-link {
			width: fit-content;
		}

		.card-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.guide-card {
			padding: var(--spacing-lg);
			gap: var(--spacing-md);
		}

		.guide-card h2 {
			font-size: 1.35rem;
		}

		.card-highlights li {
			font-size: 0.9rem;
		}
	}

	@media (min-width: 1024px) {
		.landing {
			padding: var(--spacing-2xl) var(--spacing-lg) calc(var(--spacing-2xl) * 1.25);
		}

		.hero {
			grid-template-columns: minmax(0, 1.3fr) minmax(420px, 1fr);
			gap: var(--spacing-xl);
			padding: calc(var(--spacing-2xl) * 0.95);
		}

		.hero-copy {
			gap: var(--spacing-md);
		}

		h1 {
			font-size: clamp(3rem, 4.4vw, 4.8rem);
			max-width: 10ch;
		}

		.lede {
			max-width: 54ch;
			font-size: 1.05rem;
		}

		.hero-panel {
			padding: var(--spacing-lg);
			max-width: 40rem;
		}

		.panel-title {
			max-width: none;
		}

		.card-grid {
			grid-template-columns: repeat(2, minmax(320px, 1fr));
			gap: var(--spacing-lg);
		}

		.section-title {
			max-width: none;
		}
	}

	@media (min-width: 1320px) {
		.card-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.card-header {
			align-items: flex-start;
		}
	}
</style>

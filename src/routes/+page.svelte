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

	const accentVariants = ['aurora', 'signal', 'ember'] as const;

	const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
		`${count} ${count === 1 ? singular : plural}`;

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
		firstItem: guideCollection.items[0] ?? null,
		previewItems: guideCollection.items.slice(1, 3),
		remainingItemCount: Math.max(guideCollection.items.length - 3, 0),
		accent: accentVariants[index % accentVariants.length]
	}));

	$: libraryStats = [
		pluralize(guideTypes.length, 'live collection'),
		pluralize(
			guideTypes.reduce((total, guideType) => total + guideType.publishedCount, 0),
			'published guide'
		)
	];
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
			<h1>Software guides for launch-ready teams</h1>
			<p class="lede">
				Explore a curated library of practical guidance for building the future of software,
				from interface patterns to product decisions and release-ready systems.
			</p>
			<div class="actions">
				<a class="button primary" href="#guide-types">Browse Guide Types</a>
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
			<div>
				<p class="section-label">Guide Types</p>
				<p class="section-title">Browse the collections currently available on the site.</p>
				<p class="section-support">
					Each collection card now gives you a fast overview, a preview of notable guides, and
					a direct way into the first guide when you already know where to start.
				</p>
			</div>

			{#if guideTypes.length > 0}
				<ul class="section-stats" aria-label="Collection overview">
					{#each libraryStats as stat}
						<li>{stat}</li>
					{/each}
				</ul>
			{/if}
		</div>

		{#if guideTypes.length > 0}
			<div class="card-grid">
				{#each guideTypes as guideType}
					<article class={`guide-card ${guideType.accent}`}>
						<div class="card-header">
							<div class="card-heading-group">
								<p class="card-label">{guideType.label}</p>
								<p class="card-count">{guideType.countLabel}</p>
							</div>
							<a class="card-meta-link" href={guideType.href}>View collection</a>
						</div>

						<div class="card-body">
							<h2>
								<a class="card-title-link" href={guideType.href}>{guideType.name}</a>
							</h2>
							<p class="card-description">{guideType.description}</p>
						</div>

						<div class="card-actions" class:card-actions-featured={!!guideType.firstItem}>
							{#if guideType.firstItem}
								<a
									class="card-action card-action-featured"
									href={guideType.firstItem.href}
								>
									<span class="card-action-label">Recommended starting point</span>
									<span class="card-action-title">{guideType.firstItem.title}</span>
									<span class="card-action-copy">Read the first guide in this collection</span>
								</a>
							{/if}
							<a
								class="card-action card-action-collection"
								href={guideType.href}
								aria-label={`Browse ${guideType.name}`}
							>
								<span class="card-action-label">Browse the full collection</span>
								<span class="card-action-body">
									<span class="card-action-title">{guideType.name}</span>
									<span class="card-action-copy">{guideType.countLabel}</span>
								</span>
							</a>
						</div>

						<div class="card-preview">
							<p class="card-preview-label">Inside this collection</p>
							{#if guideType.previewItems.length > 0}
								<ul class="card-highlights" aria-label={`${guideType.name} highlights`}>
									{#each guideType.previewItems as item}
										<li>
											<a class="highlight-link" href={item.href}>{item.title}</a>
										</li>
									{/each}
								</ul>
							{/if}
							{#if guideType.remainingItemCount > 0}
								<p class="card-preview-more">
									+{guideType.remainingItemCount}
									{guideType.remainingItemCount === 1 ? ' more guide' : ' more guides'}
								</p>
							{/if}
						</div>
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
		gap: var(--spacing-md);
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

	.section-support {
		margin: var(--spacing-sm) 0 0;
		max-width: 62ch;
		color: var(--color-text-secondary);
		line-height: 1.65;
	}

	.section-stats {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.section-stats li {
		padding: 0.45rem 0.8rem;
		border-radius: var(--radius-pill, 999px);
		border: 1px solid color-mix(in srgb, var(--color-border) 86%, var(--color-primary));
		background: color-mix(in srgb, var(--color-background) 68%, var(--color-surface));
		font-size: 0.82rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.card-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-md);
	}

	.guide-card {
		position: relative;
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
		overflow: hidden;
		transition:
			transform var(--transition-base),
			border-color var(--transition-base),
			box-shadow var(--transition-base);
	}

	.guide-card::before {
		content: '';
		position: absolute;
		inset: 0 auto auto 0;
		width: 100%;
		height: 0.2rem;
		background: linear-gradient(
			90deg,
			color-mix(in srgb, var(--color-primary) 78%, transparent),
			color-mix(in srgb, var(--color-secondary) 68%, transparent)
		);
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

	.guide-card.ember {
		background:
			radial-gradient(circle at top right, color-mix(in srgb, var(--color-warning) 18%, transparent), transparent 36%),
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

	.card-heading-group {
		display: grid;
		gap: var(--spacing-xs);
	}

	.card-label {
		margin: 0;
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.card-count {
		margin: 0;
		display: inline-flex;
		align-items: center;
		width: fit-content;
		padding: 0.3rem 0.65rem;
		border-radius: var(--radius-pill, 999px);
		border: 1px solid color-mix(in srgb, var(--color-border) 84%, var(--color-primary));
		background: color-mix(in srgb, var(--color-background) 60%, var(--color-surface));
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.card-meta-link {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.card-body {
		display: grid;
		gap: var(--spacing-sm);
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

	.card-preview {
		display: grid;
		gap: var(--spacing-sm);
		padding: 0.85rem;
		border-radius: calc(var(--radius-lg) - 0.2rem);
		border: 1px solid color-mix(in srgb, var(--color-border) 90%, var(--color-primary));
		background: color-mix(in srgb, var(--color-background) 64%, var(--color-surface));
	}

	.card-preview-label {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.card-highlights {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--spacing-xs);
	}

	.card-highlights li {
		padding: 0.7rem 0.8rem;
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-background) 78%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-border) 88%, var(--color-primary));
		font-size: 0.82rem;
		line-height: 1.4;
	}

	.highlight-link {
		display: inline-flex;
		width: 100%;
		align-items: center;
		color: var(--color-text);
		text-decoration: none;
	}

	.card-preview-more {
		margin: 0;
		font-size: 0.82rem;
		color: var(--color-text-secondary);
	}

	.card-actions {
		display: grid;
		gap: var(--spacing-sm);
		padding-top: 0.15rem;
	}

	.card-action {
		display: grid;
		gap: 0.5rem;
		width: 100%;
		min-height: auto;
		padding: 1rem 1.1rem;
		border-radius: calc(var(--radius-lg) - 0.2rem);
		border: 1px solid color-mix(in srgb, var(--color-border) 86%, var(--color-primary));
		text-decoration: none;
		align-content: start;
		color: var(--color-text);
		background: color-mix(in srgb, var(--color-background) 74%, var(--color-surface));
		transition:
			transform var(--transition-base),
			border-color var(--transition-base),
			background var(--transition-base),
			box-shadow var(--transition-base);
	}

	.card-action:hover {
		transform: translateY(-2px);
		border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border));
		box-shadow: var(--shadow-md);
	}

	.card-action-label {
		font-size: 0.74rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.card-action-title {
		font-size: clamp(1rem, 4vw, 1.45rem);
		font-weight: 700;
		line-height: 1.15;
		text-wrap: balance;
	}

	.card-action-copy {
		font-size: 0.88rem;
		line-height: 1.55;
		color: var(--color-text-secondary);
	}

	.card-action-body {
		display: grid;
		gap: 0.35rem;
	}

	.card-action-featured {
		min-height: 10rem;
		align-content: end;
		background:
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--color-background) 88%, var(--color-primary)) 0%,
				color-mix(in srgb, var(--color-surface) 92%, var(--color-background)) 100%
			),
			var(--color-surface);
		border-color: color-mix(in srgb, var(--color-primary) 34%, var(--color-border));
		box-shadow: inset 0 1px 0 color-mix(in srgb, var(--color-background) 65%, transparent);
		color: var(--color-text);
	}

	.card-action-featured .card-action-label,
	.card-action-featured .card-action-copy {
		color: var(--color-text-secondary);
	}

	.card-action-featured:hover {
		color: var(--color-text);
		background:
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--color-background) 82%, var(--color-primary)) 0%,
				color-mix(in srgb, var(--color-surface) 88%, var(--color-background)) 100%
			),
			var(--color-surface);
	}

	.card-action-collection {
		background:
			radial-gradient(circle at top left, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 45%),
			color-mix(in srgb, var(--color-background) 78%, var(--color-surface));
	}

	.card-action-collection .card-action-body {
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: end;
		column-gap: var(--spacing-sm);
	}

	.card-action-collection .card-action-title {
		font-size: clamp(1rem, 3vw, 1.2rem);
	}

	.card-action-collection .card-action-copy {
		white-space: nowrap;
		text-align: right;
	}

	:global([data-theme='dark']) .card-action-featured {
		background:
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--color-surface) 88%, var(--color-primary)) 0%,
				color-mix(in srgb, var(--color-surface) 96%, var(--color-background)) 100%
			),
			var(--color-surface);
		border-color: color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
		box-shadow:
			inset 0 1px 0 color-mix(in srgb, var(--color-background) 10%, white),
			0 0 0 1px color-mix(in srgb, var(--color-background) 14%, transparent);
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

		.button {
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

		.card-action-featured {
			min-height: 11rem;
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

		.section-copy {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: end;
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
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.card-header {
			align-items: flex-start;
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.guide-card:hover {
			transform: translateY(-0.2rem);
			border-color: color-mix(in srgb, var(--color-border) 55%, var(--color-primary));
			box-shadow: var(--shadow-lg);
		}
	}
</style>

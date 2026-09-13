<!--
  Dynamic CMS Content Type List Page

  Renders a list of published content items for any registered content type.
  Uses the content type's listTemplate setting for layout selection.

  Every card carries a generated cover: the topic is read out of the guide's own
  title, slug and summary, so a reader can see what each guide is about before
  reading it. See $lib/cms/guideVisuals.
-->
<script lang="ts">
	import type { PageData } from './$types';
	import SharingMeta from '$lib/components/SharingMeta.svelte';
	import GuideCover from '$lib/components/GuideCover.svelte';
	import { resolveGuideVisual } from '$lib/cms/guideVisuals';

	export let data: PageData;

	$: contentType = data.contentType;
	$: items = data.items || [];
	$: totalPages = data.totalPages || 1;
	$: currentPage = data.page || 1;

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getRoutePrefix(): string {
		return contentType.settings.routePrefix || `/${contentType.slug}`;
	}

	function asText(value: unknown): string {
		return typeof value === 'string' ? value : '';
	}

	function inkColor(ink: 'light' | 'dark'): string {
		return ink === 'light' ? '#ffffff' : '#0b1020';
	}

	/**
	 * The section gets its own motif too, so the page header says what the whole
	 * collection is about rather than being an empty box with a title in it.
	 */
	$: sectionVisual = resolveGuideVisual({
		title: contentType.name,
		slug: contentType.slug,
		summary: contentType.description ?? ''
	});

	// A section whose name matches no topic gets the neutral mark, and calling
	// that "Guide" tells the reader nothing. Name the thing instead.
	$: sectionLabel =
		sectionVisual.topic.id === 'general' ? 'Guide collection' : sectionVisual.topic.label;

	$: cards = items.map((item) => ({
		item,
		image: asText(item.fields.featured_image) || null,
		visual: resolveGuideVisual({
			title: item.title,
			slug: item.slug,
			summary: asText(item.fields.excerpt) || item.seoDescription || '',
			contentTypeSlug: contentType.slug,
			contentTypeName: contentType.name
		})
	}));
</script>

<SharingMeta title={contentType.name} description={contentType.description || ''} />

<div
	class="cms-list-page"
	style="--accent: {sectionVisual.topic.accent}; --on-accent: {inkColor(sectionVisual.topic.ink)}"
>
	<header class="cms-list-header">
		<div class="cms-list-header-copy">
			<p class="cms-list-eyebrow">
				<span class="cms-list-eyebrow-dot" aria-hidden="true"></span>
				{sectionLabel}
			</p>
			<h1>{contentType.name}</h1>
			{#if contentType.description}
				<p class="cms-list-description">{contentType.description}</p>
			{/if}
			{#if items.length > 0}
				<p class="cms-list-count">
					{items.length}
					{items.length === 1 ? 'guide' : 'guides'} in this collection
				</p>
			{/if}
		</div>
		<div class="cms-list-header-art" aria-hidden="true">
			<GuideCover topic={sectionVisual.topic.id} />
		</div>
	</header>

	{#if items.length === 0}
		<div class="cms-empty-state">
			<p>No content available yet.</p>
		</div>
	{:else}
		<!-- Blog-style list template -->
		{#if contentType.settings.listTemplate === 'blog-list'}
			<div class="cms-blog-grid">
				{#each cards as card (card.item.id)}
					<article
						class="cms-blog-card"
						style="--accent: {card.visual.topic.accent}; --on-accent: {inkColor(
							card.visual.topic.ink
						)}"
					>
						<!-- The picture is the biggest target on the card, so it goes where
						     the title goes. Hidden from the accessibility tree because the
						     heading link beside it already says the same thing. -->
						<a
							class="cms-blog-card-image"
							href="{getRoutePrefix()}/{card.item.slug}"
							tabindex="-1"
							aria-hidden="true"
						>
							<GuideCover topic={card.visual.topic.id} image={card.image} alt={card.item.title} />
						</a>
						<div class="cms-blog-card-content">
							<div class="cms-blog-topics">
								<span class="cms-topic-chip is-primary">{card.visual.topic.label}</span>
								{#each card.visual.secondary.slice(0, 1) as topic (topic.id)}
									<span class="cms-topic-chip" style="--accent: {topic.accent}">
										{topic.label}
									</span>
								{/each}
								{#if card.item.fields.category}
									<span class="cms-topic-chip is-muted">{card.item.fields.category}</span>
								{/if}
							</div>
							<h2>
								<a href="{getRoutePrefix()}/{card.item.slug}">{card.item.title}</a>
							</h2>
							{#if card.item.fields.excerpt}
								<p class="cms-blog-excerpt">{card.item.fields.excerpt}</p>
							{/if}
							<div class="cms-blog-meta">
								{#if card.item.publishedAt}
									<time datetime={card.item.publishedAt}>{formatDate(card.item.publishedAt)}</time>
								{/if}
								{#if card.item.fields.read_time}
									<span class="cms-blog-read-time">{card.item.fields.read_time} min read</span>
								{/if}
							</div>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<!-- Default list template -->
			<div class="cms-default-list">
				{#each cards as card (card.item.id)}
					<article
						class="cms-default-item"
						style="--accent: {card.visual.topic.accent}; --on-accent: {inkColor(
							card.visual.topic.ink
						)}"
					>
						<a
							class="cms-default-thumb"
							href="{getRoutePrefix()}/{card.item.slug}"
							tabindex="-1"
							aria-hidden="true"
						>
							<GuideCover topic={card.visual.topic.id} image={card.image} alt={card.item.title} />
						</a>
						<div class="cms-default-body">
							<span class="cms-topic-chip is-primary">{card.visual.topic.label}</span>
							<h2>
								<a href="{getRoutePrefix()}/{card.item.slug}">{card.item.title}</a>
							</h2>
							{#if card.item.seoDescription}
								<p>{card.item.seoDescription}</p>
							{/if}
							{#if card.item.publishedAt}
								<time datetime={card.item.publishedAt}>{formatDate(card.item.publishedAt)}</time>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		{/if}

		<!-- Pagination -->
		{#if totalPages > 1}
			<nav class="cms-pagination" aria-label="Pagination">
				{#if currentPage > 1}
					<a href="?page={currentPage - 1}" class="cms-pagination-link" aria-label="Previous page">
						&larr; Previous
					</a>
				{/if}
				<span class="cms-pagination-info">
					Page {currentPage} of {totalPages}
				</span>
				{#if currentPage < totalPages}
					<a href="?page={currentPage + 1}" class="cms-pagination-link" aria-label="Next page">
						Next &rarr;
					</a>
				{/if}
			</nav>
		{/if}
	{/if}
</div>

<style>
	.cms-list-page {
		max-width: 1720px;
		margin: 0 auto;
		padding: var(--spacing-xl) var(--spacing-md);
	}

	.cms-list-header {
		margin-bottom: clamp(var(--spacing-2xl), 4vw, 4rem);
		display: grid;
		gap: clamp(var(--spacing-lg), 3vw, var(--spacing-2xl));
		align-items: center;
		padding: clamp(var(--spacing-xl), 4vw, 3rem);
		border: 1px solid color-mix(in srgb, var(--accent) 26%, var(--color-border));
		border-radius: 1.5rem;
		background:
			radial-gradient(
				circle at 82% 12%,
				color-mix(in srgb, var(--accent) 20%, transparent),
				transparent 58%
			),
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--color-surface) 84%, var(--color-background)) 0%,
				color-mix(in srgb, var(--color-background) 94%, var(--color-surface)) 100%
			),
			var(--color-background);
		box-shadow: var(--shadow-md);
	}

	.cms-list-eyebrow {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: 0.8125rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: color-mix(in srgb, var(--accent) 58%, var(--color-text));
		margin-bottom: var(--spacing-sm);
	}

	.cms-list-eyebrow-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent);
	}

	.cms-list-header h1 {
		font-size: clamp(2rem, 4vw, 2.75rem);
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: var(--spacing-sm);
		letter-spacing: -0.02em;
	}

	.cms-list-description {
		color: var(--color-text-secondary);
		font-size: 1.125rem;
		max-width: 48rem;
	}

	.cms-list-count {
		margin-top: var(--spacing-md);
		font-size: 0.875rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--accent) 52%, var(--color-text));
	}

	.cms-list-header-art {
		border-radius: 1.125rem;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--accent) 24%, var(--color-border));
		/* Decorative: never the reason the header grows on a narrow screen. */
		display: none;
	}

	.cms-empty-state {
		text-align: center;
		padding: var(--spacing-2xl);
		color: var(--color-text-secondary);
	}

	/* Topic chips */
	.cms-blog-topics {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-xs);
	}

	.cms-topic-chip {
		display: inline-flex;
		align-items: center;
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.25rem 0.5rem;
		border-radius: 999px;
		/* Mixing toward the text colour keeps the label readable on any accent. */
		color: color-mix(in srgb, var(--accent) 45%, var(--color-text));
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
		white-space: nowrap;
	}

	.cms-topic-chip.is-primary {
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		border-color: color-mix(in srgb, var(--accent) 42%, transparent);
	}

	.cms-topic-chip.is-muted {
		color: var(--color-text-secondary);
		background: color-mix(in srgb, var(--color-text) 7%, transparent);
		border-color: var(--color-border);
	}

	/* Blog grid template */
	.cms-blog-grid {
		display: grid;
		gap: var(--spacing-xl);
	}

	.cms-blog-card {
		display: flex;
		flex-direction: column;
		border: 1px solid color-mix(in srgb, var(--accent) 18%, var(--color-border));
		border-radius: 1.25rem;
		overflow: hidden;
		background:
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--color-surface) 90%, var(--color-background)) 0%,
				color-mix(in srgb, var(--color-background) 96%, var(--color-surface)) 100%
			),
			var(--color-surface);
		box-shadow: var(--shadow-sm);
		transition:
			box-shadow var(--transition-base),
			transform var(--transition-base),
			border-color var(--transition-base);
	}

	.cms-blog-card:hover {
		box-shadow: var(--shadow-lg);
		transform: translateY(-4px);
		border-color: color-mix(in srgb, var(--accent) 55%, var(--color-border));
	}

	.cms-blog-card-image {
		display: block;
	}

	.cms-blog-card-content {
		padding: clamp(var(--spacing-lg), 2.5vw, var(--spacing-xl));
		display: grid;
		gap: var(--spacing-sm);
		align-content: start;
	}

	.cms-blog-card-content h2 {
		font-size: 1.375rem;
		font-weight: 600;
		line-height: 1.3;
		letter-spacing: -0.02em;
	}

	.cms-blog-card-content h2 a {
		color: var(--color-text);
		text-decoration: none;
	}

	.cms-blog-card-content h2 a:hover {
		color: color-mix(in srgb, var(--accent) 60%, var(--color-text));
	}

	.cms-blog-excerpt {
		color: var(--color-text-secondary);
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	.cms-blog-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-md);
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
	}

	.cms-blog-read-time::before {
		content: '·';
		margin-right: var(--spacing-sm);
	}

	/* Default list template */
	.cms-default-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.cms-default-item {
		display: grid;
		gap: var(--spacing-lg);
		padding: var(--spacing-lg);
		border: 1px solid color-mix(in srgb, var(--accent) 18%, var(--color-border));
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		transition: border-color var(--transition-base);
	}

	.cms-default-item:hover {
		border-color: color-mix(in srgb, var(--accent) 55%, var(--color-border));
	}

	.cms-default-thumb {
		display: block;
		border-radius: var(--radius-md);
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--accent) 20%, var(--color-border));
	}

	.cms-default-body {
		display: grid;
		gap: var(--spacing-xs);
		justify-items: start;
		align-content: start;
	}

	.cms-default-item h2 {
		font-size: 1.25rem;
	}

	.cms-default-item h2 a {
		color: var(--color-text);
		text-decoration: none;
	}

	.cms-default-item h2 a:hover {
		color: color-mix(in srgb, var(--accent) 60%, var(--color-text));
	}

	.cms-default-item p {
		color: var(--color-text-secondary);
	}

	.cms-default-item time {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
	}

	/* Pagination */
	.cms-pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-lg);
		margin-top: var(--spacing-2xl);
		padding-top: var(--spacing-lg);
		border-top: 1px solid var(--color-border);
	}

	.cms-pagination-link {
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 500;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		transition: background-color 0.2s ease;
	}

	.cms-pagination-link:hover {
		background-color: var(--color-surface-hover);
	}

	.cms-pagination-info {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	@media (min-width: 640px) {
		.cms-default-item {
			grid-template-columns: 200px 1fr;
			align-items: center;
		}
	}

	@media (min-width: 768px) {
		.cms-blog-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 900px) {
		.cms-list-header {
			grid-template-columns: minmax(0, 1fr) minmax(240px, 22rem);
		}

		.cms-list-header-art {
			display: block;
		}
	}

	@media (min-width: 1100px) {
		.cms-list-page {
			padding: calc(var(--spacing-2xl) * 1.1) var(--spacing-xl);
		}

		.cms-blog-grid {
			grid-template-columns: repeat(3, 1fr);
			gap: clamp(var(--spacing-xl), 2.5vw, 2.5rem);
		}
	}

	@media (min-width: 1400px) {
		.cms-blog-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cms-blog-card {
			transition: none;
		}

		.cms-blog-card:hover {
			transform: none;
		}
	}
</style>

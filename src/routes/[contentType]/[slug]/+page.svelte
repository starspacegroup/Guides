<!--
  Dynamic CMS Content Item Page

  Renders a single published content item.
  Uses the content type's itemTemplate setting for layout selection.
-->
<script lang="ts">
	import type { PageData } from './$types';
	import SharingMeta from '$lib/components/SharingMeta.svelte';
	import { renderMarkdownToHtml } from '$lib/utils/markdown';

	export let data: PageData;

	$: contentType = data.contentType;
	$: item = data.item;
	$: tags = data.tags || [];

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

	function renderRichText(value: unknown): string {
		return renderMarkdownToHtml(typeof value === 'string' ? value : '');
	}
</script>

<SharingMeta
	title={item.seoTitle || item.title}
	description={item.seoDescription || ''}
	image={item.seoImage || ''}
	type="article"
	publishedTime={item.publishedAt || ''}
/>

<div class="cms-item-page">
	<!-- Back link -->
	<a href={getRoutePrefix()} class="cms-back-link">
		&larr; Back to {contentType.name}
	</a>

	<div class="cms-item-shell">
		<!-- Blog item template -->
		{#if contentType.settings.itemTemplate === 'blog-item'}
			<article class="cms-blog-article">
				<header class="cms-blog-article-header">
					{#if item.fields.category}
						<span class="cms-blog-article-category">{item.fields.category}</span>
					{/if}
					<h1>{item.title}</h1>
					<div class="cms-blog-article-meta">
						{#if item.publishedAt}
							<time class="cms-blog-meta-chip" datetime={item.publishedAt}>
								{formatDate(item.publishedAt)}
							</time>
						{/if}
						{#if item.fields.read_time}
							<span class="cms-blog-meta-chip cms-read-time">{item.fields.read_time} min read</span>
						{/if}
					</div>
					{#if tags.length > 0}
						<div class="cms-blog-article-tags">
							{#each tags as tag}
								<a href="{getRoutePrefix()}?tag={tag.slug}" class="cms-tag">{tag.name}</a>
							{/each}
						</div>
					{/if}
				</header>

				<div class="cms-blog-article-main">
					{#if item.fields.featured_image}
						<div class="cms-blog-article-hero">
							<img src={String(item.fields.featured_image)} alt={item.title} />
						</div>
					{/if}

					<div class="cms-blog-article-copy">
						{#if item.fields.excerpt}
							<div class="cms-blog-article-intro">
								<div class="cms-blog-article-excerpt">
									<p>{item.fields.excerpt}</p>
								</div>
							</div>
						{/if}

						<div class="cms-blog-article-body cms-content">
							{@html renderRichText(item.fields.body)}
						</div>
					</div>
				</div>
			</article>
		{:else}
			<!-- Default item template -->
			<article class="cms-default-article">
				<header>
					<h1>{item.title}</h1>
					{#if item.publishedAt}
						<time datetime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
					{/if}
				</header>

				{#if tags.length > 0}
					<div class="cms-article-tags">
						{#each tags as tag}
							<a href="{getRoutePrefix()}?tag={tag.slug}" class="cms-tag">{tag.name}</a>
						{/each}
					</div>
				{/if}

				<!-- Render all custom fields -->
				<div class="cms-default-article-fields">
					{#each contentType.fields as fieldDef}
						{#if item.fields[fieldDef.name] !== undefined && item.fields[fieldDef.name] !== null && item.fields[fieldDef.name] !== ''}
							<div class="cms-field-block">
								{#if fieldDef.type === 'richtext'}
									<div class="cms-content">{@html renderRichText(item.fields[fieldDef.name])}</div>
								{:else if fieldDef.type === 'image' || fieldDef.type === 'url'}
									{#if fieldDef.type === 'image'}
										<img src={String(item.fields[fieldDef.name])} alt={fieldDef.label} />
									{:else}
										<a href={String(item.fields[fieldDef.name])} target="_blank" rel="noopener">
											{item.fields[fieldDef.name]}
										</a>
									{/if}
								{:else if fieldDef.type === 'boolean'}
									<p>
										<strong>{fieldDef.label}:</strong>
										{item.fields[fieldDef.name] ? 'Yes' : 'No'}
									</p>
								{:else}
									<p>{item.fields[fieldDef.name]}</p>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			</article>
		{/if}
	</div>
</div>

<style>
	.cms-item-page {
		position: relative;
		max-width: 1240px;
		margin: 0 auto;
		padding: clamp(var(--spacing-xl), 4vw, 4rem) var(--spacing-md) var(--spacing-2xl);
	}

	.cms-item-page::before,
	.cms-item-page::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
	}

	.cms-item-page::before {
		background:
			radial-gradient(circle at top left, color-mix(in srgb, var(--color-primary) 18%, var(--color-background)) 0%, var(--color-background) 58%),
			radial-gradient(circle at top right, color-mix(in srgb, var(--color-secondary) 14%, var(--color-background)) 0%, var(--color-background) 42%);
	}

	.cms-item-page::after {
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--color-surface) 72%, var(--color-background)) 0%,
			var(--color-background) 22%
		);
	}

	.cms-back-link,
	.cms-item-shell {
		position: relative;
		z-index: 1;
	}

	.cms-item-shell {
		display: grid;
		gap: var(--spacing-xl);
	}

	.cms-back-link {
		display: inline-block;
		padding: var(--spacing-sm) var(--spacing-md);
		color: var(--color-text-secondary);
		text-decoration: none;
		font-size: 0.875rem;
		margin-bottom: var(--spacing-lg);
		border: 1px solid color-mix(in srgb, var(--color-border) 80%, var(--color-background));
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-surface) 84%, var(--color-background));
		box-shadow: var(--shadow-sm);
		transition:
			color var(--transition-fast),
			border-color var(--transition-fast),
			transform var(--transition-fast),
			background-color var(--transition-fast);
	}

	.cms-back-link:hover {
		color: var(--color-primary);
		border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border));
		background: color-mix(in srgb, var(--color-surface-hover) 88%, var(--color-background));
		transform: translateY(-1px);
	}

	/* Blog article template */
	.cms-blog-article {
		display: grid;
		gap: clamp(var(--spacing-lg), 3vw, var(--spacing-2xl));
	}

	.cms-blog-article-header {
		position: relative;
		overflow: hidden;
		display: grid;
		gap: var(--spacing-md);
		padding: clamp(var(--spacing-xl), 4vw, 3.5rem);
		border: 1px solid color-mix(in srgb, var(--color-border) 76%, var(--color-background));
		border-radius: 1.5rem;
		background:
			linear-gradient(
				135deg,
				color-mix(in srgb, var(--color-surface) 92%, var(--color-background)) 0%,
				color-mix(in srgb, var(--color-background) 88%, var(--color-primary)) 100%
			),
			var(--color-background);
		box-shadow: var(--shadow-lg);
	}

	.cms-blog-article-header::after {
		content: '';
		position: absolute;
		top: -12%;
		right: -10%;
		width: min(32vw, 18rem);
		height: min(32vw, 18rem);
		border-radius: 50%;
		background: radial-gradient(
			circle,
			color-mix(in srgb, var(--color-primary) 22%, var(--color-background)) 0%,
			color-mix(in srgb, var(--color-background) 96%, var(--color-primary)) 72%
		);
		opacity: 0.95;
	}

	.cms-blog-article-category {
		position: relative;
		z-index: 1;
		display: inline-block;
		width: fit-content;
		padding: 0.4rem 0.8rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: color-mix(in srgb, var(--color-primary) 82%, var(--color-text));
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-primary) 18%, var(--color-border));
		border-radius: 999px;
	}

	.cms-blog-article-header h1 {
		position: relative;
		z-index: 1;
		max-width: 14ch;
		font-size: clamp(2.8rem, 5vw, 4.9rem);
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.05;
		letter-spacing: -0.04em;
	}

	.cms-blog-article-meta {
		position: relative;
		z-index: 1;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-md);
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.cms-blog-meta-chip {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: 0.55rem 0.85rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-background) 72%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-border) 84%, var(--color-background));
		box-shadow: var(--shadow-sm);
	}

	.cms-read-time::before {
		content: '·';
		margin-right: var(--spacing-sm);
	}

	.cms-blog-article-tags,
	.cms-article-tags {
		position: relative;
		z-index: 1;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.cms-tag {
		display: inline-block;
		padding: 0.45rem 0.8rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: color-mix(in srgb, var(--color-primary) 80%, var(--color-text));
		background-color: color-mix(in srgb, var(--color-surface) 80%, var(--color-background));
		border: 1px solid color-mix(in srgb, var(--color-primary) 16%, var(--color-border));
		border-radius: 999px;
		text-decoration: none;
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast),
			transform var(--transition-fast);
	}

	.cms-tag:hover {
		background-color: color-mix(in srgb, var(--color-surface-hover) 84%, var(--color-background));
		border-color: color-mix(in srgb, var(--color-primary) 34%, var(--color-border));
		transform: translateY(-1px);
	}

	.cms-blog-article-main {
		display: grid;
		gap: clamp(var(--spacing-lg), 3vw, var(--spacing-2xl));
	}

	.cms-blog-article-copy {
		display: grid;
		gap: var(--spacing-lg);
	}

	.cms-blog-article-hero {
		position: relative;
		isolation: isolate;
		border-radius: 1.75rem;
		overflow: hidden;
		box-shadow: var(--shadow-xl);
	}

	.cms-blog-article-hero::after {
		content: '';
		position: absolute;
		inset: auto 0 0;
		height: 28%;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--color-background) 100%, var(--color-surface)) 0%,
			color-mix(in srgb, var(--color-background) 68%, var(--color-surface)) 100%
		);
		opacity: 0.18;
		z-index: 1;
	}

	.cms-blog-article-hero img {
		width: 100%;
		height: auto;
		display: block;
		aspect-ratio: 16 / 8.5;
		object-fit: cover;
	}

	.cms-blog-article-intro {
		max-width: 62rem;
	}

	.cms-blog-article-excerpt {
		padding: clamp(var(--spacing-lg), 3vw, var(--spacing-xl));
		border-left: 4px solid color-mix(in srgb, var(--color-primary) 54%, var(--color-border));
		border-radius: 0 var(--radius-xl) var(--radius-xl) 0;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 8%, var(--color-surface)) 0%,
			color-mix(in srgb, var(--color-surface) 96%, var(--color-background)) 100%
		);
		box-shadow: var(--shadow-sm);
	}

	.cms-blog-article-excerpt p {
		font-size: clamp(1.18rem, 2vw, 1.55rem);
		font-weight: 500;
		line-height: 1.6;
		color: color-mix(in srgb, var(--color-text-secondary) 86%, var(--color-text));
	}

	/* Rich text content styles */
	.cms-content {
		max-width: 74ch;
		padding: clamp(var(--spacing-lg), 3vw, 2.5rem);
		border: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--color-background));
		border-radius: 1.5rem;
		background: color-mix(in srgb, var(--color-surface) 70%, var(--color-background));
		box-shadow: var(--shadow-md);
		font-size: 1.0625rem;
		line-height: 1.8;
		color: var(--color-text);
	}

	.cms-blog-article-body {
		width: min(100%, 74rem);
	}

	.cms-content :global(h2) {
		font-size: clamp(1.7rem, 2.4vw, 2.45rem);
		font-weight: 600;
		margin-top: var(--spacing-2xl);
		margin-bottom: var(--spacing-md);
		line-height: 1.15;
		letter-spacing: -0.03em;
	}

	.cms-content :global(h3) {
		font-size: clamp(1.3rem, 1.9vw, 1.7rem);
		font-weight: 600;
		margin-top: var(--spacing-xl);
		margin-bottom: var(--spacing-sm);
		line-height: 1.2;
	}

	.cms-content :global(p) {
		margin-bottom: var(--spacing-md);
	}

	.cms-content :global(a) {
		color: var(--color-primary);
		text-decoration: underline;
	}

	.cms-content :global(ul),
	.cms-content :global(ol) {
		margin-bottom: var(--spacing-md);
		padding-left: 1.35em;
	}

	.cms-content :global(li) {
		margin-bottom: 0.4em;
	}

	.cms-content :global(blockquote) {
		border-left: 4px solid color-mix(in srgb, var(--color-primary) 50%, var(--color-border));
		padding: var(--spacing-md) 0 var(--spacing-md) var(--spacing-lg);
		margin: var(--spacing-lg) 0;
		color: var(--color-text-secondary);
		font-style: italic;
		background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
		border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
	}

	.cms-content :global(code) {
		font-family: 'Fira Code', 'Consolas', monospace;
		font-size: 0.875em;
		background-color: color-mix(in srgb, var(--color-surface) 92%, var(--color-background));
		padding: 0.125em 0.375em;
		border-radius: var(--radius-sm);
	}

	.cms-content :global(pre) {
		background-color: color-mix(in srgb, var(--color-surface) 92%, var(--color-background));
		border: 1px solid color-mix(in srgb, var(--color-border) 88%, var(--color-background));
		border-radius: var(--radius-md);
		padding: var(--spacing-lg);
		overflow-x: auto;
		margin-bottom: var(--spacing-md);
		box-shadow: inset 0 1px 0 color-mix(in srgb, var(--color-background) 75%, var(--color-surface));
	}

	.cms-content :global(pre code) {
		background: none;
		padding: 0;
	}

	.cms-content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-lg);
		margin: var(--spacing-lg) 0;
		box-shadow: var(--shadow-md);
	}

	/* Default article template */
	.cms-default-article {
		padding: clamp(var(--spacing-xl), 4vw, 3rem);
		border: 1px solid color-mix(in srgb, var(--color-border) 80%, var(--color-background));
		border-radius: 1.5rem;
		background: color-mix(in srgb, var(--color-surface) 78%, var(--color-background));
		box-shadow: var(--shadow-md);
	}

	.cms-default-article header {
		margin-bottom: var(--spacing-xl);
	}

	.cms-default-article h1 {
		font-size: clamp(2.4rem, 4vw, 3.8rem);
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: var(--spacing-sm);
		line-height: 1.08;
		letter-spacing: -0.035em;
	}

	.cms-default-article time {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.cms-default-article-fields {
		margin-top: var(--spacing-xl);
	}

	.cms-field-block {
		margin-bottom: var(--spacing-lg);
	}

	.cms-field-block img {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
	}

	@media (min-width: 900px) {
		.cms-item-page {
			padding-inline: var(--spacing-xl);
		}

		.cms-blog-article-main {
			grid-template-columns: minmax(0, 1.3fr) minmax(18rem, 0.9fr);
			align-items: start;
		}

		.cms-blog-article-hero {
			order: 2;
			position: sticky;
			top: calc(var(--spacing-xl) + 4rem);
		}

		.cms-blog-article-copy {
			order: 1;
		}

		.cms-blog-article-header h1 {
			max-width: 11ch;
		}

		.cms-content {
			padding: clamp(var(--spacing-xl), 2.5vw, 3rem);
		}
	}

	@media (min-width: 1200px) {
		.cms-item-page {
			padding-inline: 2.5rem;
		}

		.cms-blog-article-main {
			grid-template-columns: minmax(0, 1.2fr) minmax(22rem, 0.95fr);
			gap: clamp(var(--spacing-xl), 3vw, 3rem);
		}

		.cms-blog-article-header {
			padding-right: min(26rem, 28vw);
		}
	}

	@media (max-width: 899px) {
		.cms-item-page {
			padding-top: var(--spacing-lg);
		}

		.cms-blog-article-header h1,
		.cms-default-article h1 {
			max-width: none;
		}

		.cms-content,
		.cms-default-article {
			padding: var(--spacing-lg);
		}
	}
</style>

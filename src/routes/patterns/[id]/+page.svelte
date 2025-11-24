<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container">
	<nav class="breadcrumb">
		<a href="/patterns">← Back to Patterns</a>
	</nav>

	<article class="content">
		<h1>{data.pattern.title}</h1>
		<p class="description">{data.pattern.description}</p>
		
		<div class="meta-section">
			{#if data.relatedPrinciples.length > 0}
				<div class="principles">
					<strong>Related Principles:</strong>
					{#each data.relatedPrinciples as principle}
						<a href="/principles/{principle.id}" class="principle-tag">
							{principle.title}
						</a>
					{/each}
				</div>
			{/if}
			
			<div class="meta">
				Created: {new Date(data.pattern.createdAt).toLocaleDateString()}
			</div>
		</div>

		{#if data.pattern.content}
			<div class="rich-content">
				{@html data.pattern.content}
			</div>
		{:else}
			<p class="no-content">No detailed content available yet.</p>
		{/if}
	</article>
</div>

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
	}

	.breadcrumb {
		margin-bottom: 2rem;
	}

	.breadcrumb a {
		color: var(--nav-bg);
		text-decoration: none;
		font-size: 0.95rem;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.content {
		background: var(--bg-secondary);
		padding: 3rem;
		border-radius: 8px;
		border: 1px solid var(--border-primary);
	}

	h1 {
		margin: 0 0 1rem 0;
		color: var(--nav-bg);
		font-size: 2.5rem;
	}

	.description {
		font-size: 1.2rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
		line-height: 1.6;
	}

	.meta-section {
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-primary);
	}

	.principles {
		margin-bottom: 1rem;
		line-height: 2;
	}

	.principle-tag {
		display: inline-block;
		background: var(--bg-tertiary);
		color: var(--nav-bg);
		padding: 0.35rem 0.85rem;
		border-radius: 12px;
		font-size: 0.875rem;
		margin-right: 0.5rem;
		margin-top: 0.25rem;
		text-decoration: none;
		transition: background 0.2s;
	}

	.principle-tag:hover {
		background: var(--dropdown-hover);
	}

	.meta {
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}

	.rich-content {
		line-height: 1.7;
		color: var(--text-primary);
	}

	.rich-content :global(h2) {
		font-size: 1.75rem;
		font-weight: bold;
		margin: 2rem 0 1rem 0;
		color: var(--text-primary);
	}

	.rich-content :global(h3) {
		font-size: 1.4rem;
		font-weight: bold;
		margin: 1.5rem 0 0.75rem 0;
		color: var(--text-primary);
	}

	.rich-content :global(p) {
		margin: 0.75rem 0;
	}

	.rich-content :global(ul),
	.rich-content :global(ol) {
		padding-left: 2rem;
		margin: 1rem 0;
	}

	.rich-content :global(li) {
		margin: 0.5rem 0;
	}

	.rich-content :global(pre) {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-secondary);
		border-radius: 4px;
		padding: 1rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	.rich-content :global(code) {
		background: var(--bg-tertiary);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: monospace;
		font-size: 0.9em;
	}

	.rich-content :global(pre code) {
		background: none;
		padding: 0;
	}

	.no-content {
		font-style: italic;
		color: var(--text-tertiary);
		text-align: center;
		padding: 2rem;
	}
</style>

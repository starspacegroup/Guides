<script lang="ts">
	import SharingMeta from '$lib/components/SharingMeta.svelte';
</script>

<SharingMeta
	title="Guides"
	description="Guides for everyone, created by *Space community members at guides.starspace.group"
	image="/og-image.png"
	imageAlt="Guides by *Space"
	imageWidth={1200}
	imageHeight={630}
/>

<section class="landing">
	<div class="hero">
		<p class="eyebrow">guides.starspace.group</p>
		<h1>Guides for everyone, created by *Space community members</h1>
		<p class="lede">
			Publish practical guides in section-based URLs like
			<code>/user-interface/theme-toggles</code> with Markdown-powered rich text editing.
		</p>
		<div class="actions">
			<a class="button primary" href="/auth/login">Sign In</a>
			<a class="button" href="/admin/cms">Manage Sections</a>
		</div>
	</div>

	<div class="card-grid">
		<article class="card">
			<h2>1. Create a Section</h2>
			<p>
				Use <strong>Admin CMS</strong> to create section slugs such as
				<code>user-interface</code>, <code>cloudflare</code>, or <code>automation</code>.
			</p>
		</article>
		<article class="card">
			<h2>2. Write a Guide</h2>
			<p>
				Add guide entries with a title and rich text body. The editor supports markdown-style
				formatting for fast publishing.
			</p>
		</article>
		<article class="card">
			<h2>3. Publish to URL</h2>
			<p>
				Each guide is automatically available at
				<code>/section-slug/guide-slug</code>.
			</p>
		</article>
	</div>
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
		padding: var(--spacing-2xl);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background:
			radial-gradient(circle at 10% 10%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 45%),
			radial-gradient(circle at 90% 20%, color-mix(in srgb, var(--color-secondary) 10%, transparent), transparent 40%),
			var(--color-surface);
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

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: var(--spacing-md);
	}

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
	}

	.card h2 {
		margin-top: 0;
		font-size: 1.1rem;
	}

	.card p {
		margin-bottom: 0;
		line-height: 1.65;
		color: var(--color-text-secondary);
	}

	code {
		padding: 0.15rem 0.4rem;
		border-radius: var(--radius-sm);
		background: var(--color-background);
		border: 1px solid var(--color-border);
	}

	@media (max-width: 700px) {
		.hero {
			padding: var(--spacing-lg);
		}
	}
</style>

<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav>
	<a href="/" class="logo">*Space Atlas</a>
	<div class="nav-links">
		<a href="/principles">Principles</a>
		<a href="/patterns">Patterns</a>
	</div>
</nav>

{@render children()}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		line-height: 1.6;
	}
	
	nav {
		background: #0066cc;
		color: white;
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.logo {
		font-size: 1.5rem;
		font-weight: bold;
		color: white;
		text-decoration: none;
	}
	
	.nav-links {
		display: flex;
		gap: 1.5rem;
	}
	
	.nav-links a {
		color: white;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: background 0.2s;
	}
	
	.nav-links a:hover {
		background: rgba(255, 255, 255, 0.1);
	}
</style>

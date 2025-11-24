<div class="container">
	<h1>*Space Atlas</h1>
	<p class="subtitle">Platform for creating sets of guides</p>
	
	<div class="links">
		<a href="/principles" class="card">
			<h2>Principles</h2>
			<p>Browse and create guiding principles for your patterns</p>
		</a>
		
		<a href="/patterns" class="card">
			<h2>Patterns</h2>
			<p>Explore patterns built on solid principles</p>
		</a>
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	h1 {
		font-size: 3rem;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}
	
	.subtitle {
		font-size: 1.2rem;
		color: var(--text-secondary);
		margin-bottom: 3rem;
	}
	
	.links {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}
	
	.card {
		display: block;
		padding: 2rem;
		background: var(--bg-secondary);
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: transform 0.2s, box-shadow 0.2s;
		border: 1px solid var(--border-primary);
	}
	
	.card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-md);
	}
	
	.card h2 {
		margin: 0 0 0.5rem 0;
		color: var(--nav-bg);
	}
	
	.card p {
		margin: 0;
		color: var(--text-secondary);
	}
</style>

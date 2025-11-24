<script lang="ts">
	let { data } = $props();
</script>

<div class="admin-container">
	<h1>Admin Dashboard</h1>
	
	<div class="admin-section">
		<h2>Content Management</h2>
		<div class="admin-cards">
			<a href="/principles" class="admin-card">
				<div class="card-icon">📐</div>
				<h3>Principles</h3>
				<p>Manage design principles</p>
			</a>
			
			<a href="/patterns" class="admin-card">
				<div class="card-icon">🎨</div>
				<h3>Patterns</h3>
				<p>Manage design patterns</p>
			</a>
		</div>
	</div>
	
	<div class="admin-section">
		<h2>System Information</h2>
		<div class="info-grid">
			<div class="info-item">
				<div class="info-label">Status</div>
				<div class="info-value">✓ All systems operational</div>
			</div>
		</div>
	</div>
</div>

<style>
	.admin-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		font-size: 2.5rem;
		color: var(--text-primary);
		margin-bottom: 2rem;
	}

	.admin-section {
		margin-bottom: 3rem;
	}

	h2 {
		font-size: 1.5rem;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--border-primary);
	}

	.admin-cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.admin-card {
		display: block;
		padding: 2rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
	}

	.admin-card:hover {
		border-color: var(--nav-bg);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.card-icon {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.admin-card h3 {
		font-size: 1.25rem;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.admin-card p {
		color: var(--text-secondary);
		font-size: 0.95rem;
		margin: 0;
	}

	.info-grid {
		display: grid;
		gap: 1rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: 6px;
	}

	.info-label {
		font-weight: 600;
		color: var(--text-secondary);
	}

	.info-value {
		color: var(--text-primary);
	}
</style>

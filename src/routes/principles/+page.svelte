<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let showForm = $state(false);
</script>

<div class="container">
	<div class="header">
		<h1>Principles</h1>
		<button onclick={() => showForm = !showForm} class="btn-primary">
			{showForm ? 'Cancel' : 'Add Principle'}
		</button>
	</div>

	{#if showForm}
		<form method="POST" action="?/create" use:enhance class="form-card">
			<div class="form-group">
				<label for="title">Title</label>
				<input
					type="text"
					id="title"
					name="title"
					required
					placeholder="e.g., Consistency"
				/>
			</div>
			
			<div class="form-group">
				<label for="description">Description</label>
				<textarea
					id="description"
					name="description"
					required
					rows="4"
					placeholder="Describe this principle..."
				></textarea>
			</div>

			{#if form?.success}
				<div class="success">Principle created successfully!</div>
			{/if}
			
			{#if form?.error}
				<div class="error">{form.error}</div>
			{/if}

			<button type="submit" class="btn-primary">Create Principle</button>
		</form>
	{/if}

	<div class="grid">
		{#each data.principles as principle (principle.id)}
			<div class="card">
				<h2>{principle.title}</h2>
				<p>{principle.description}</p>
				<div class="meta">
					Created: {new Date(principle.createdAt).toLocaleDateString()}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}
	
	h1 {
		margin: 0;
		color: #333;
	}
	
	.btn-primary {
		background: #0066cc;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: background 0.2s;
	}
	
	.btn-primary:hover {
		background: #0052a3;
	}
	
	.form-card {
		background: #f8f9fa;
		padding: 2rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		border: 1px solid #e0e0e0;
	}
	
	.form-group {
		margin-bottom: 1.5rem;
	}
	
	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #333;
	}
	
	input, textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		box-sizing: border-box;
	}
	
	input:focus, textarea:focus {
		outline: none;
		border-color: #0066cc;
	}
	
	.success {
		background: #d4edda;
		color: #155724;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
	
	.error {
		background: #f8d7da;
		color: #721c24;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
	
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}
	
	.card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	.card h2 {
		margin: 0 0 1rem 0;
		color: #0066cc;
		font-size: 1.3rem;
	}
	
	.card p {
		margin: 0 0 1rem 0;
		color: #666;
		line-height: 1.6;
	}
	
	.meta {
		font-size: 0.875rem;
		color: #999;
	}
</style>

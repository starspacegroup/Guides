<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let showForm = $state(false);
	
	function getPrincipleNames(principleIds: string[]) {
		return principleIds
			.map(id => data.principles.find(p => p.id === id)?.title)
			.filter(Boolean);
	}
</script>

<div class="container">
	<div class="header">
		<h1>Patterns</h1>
		<button onclick={() => showForm = !showForm} class="btn-primary">
			{showForm ? 'Cancel' : 'Add Pattern'}
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
					placeholder="e.g., Navigation Bar"
				/>
			</div>
			
			<div class="form-group">
				<label for="description">Description</label>
				<textarea
					id="description"
					name="description"
					required
					rows="4"
					placeholder="Describe this pattern..."
				></textarea>
			</div>

			<div class="form-group">
				<div class="label-text">Related Principles</div>
				<div class="checkbox-group">
					{#each data.principles as principle (principle.id)}
						<label class="checkbox-label">
							<input
								type="checkbox"
								name="principleIds"
								value={principle.id}
							/>
							{principle.title}
						</label>
					{/each}
				</div>
			</div>

			{#if form?.success}
				<div class="success">Pattern created successfully!</div>
			{/if}
			
			{#if form?.error}
				<div class="error">{form.error}</div>
			{/if}

			<button type="submit" class="btn-primary">Create Pattern</button>
		</form>
	{/if}

	<div class="grid">
		{#each data.patterns as pattern (pattern.id)}
			<div class="card">
				<h2>{pattern.title}</h2>
				<p>{pattern.description}</p>
				
				{#if pattern.principleIds.length > 0}
					<div class="principles">
						<strong>Principles:</strong>
						{#each getPrincipleNames(pattern.principleIds) as principle, i}
							<span class="principle-tag">{principle}</span>
						{/each}
					</div>
				{/if}
				
				<div class="meta">
					Created: {new Date(pattern.createdAt).toLocaleDateString()}
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
	
	label, .label-text {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #333;
	}
	
	input[type="text"], textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		box-sizing: border-box;
	}
	
	input[type="text"]:focus, textarea:focus {
		outline: none;
		border-color: #0066cc;
	}
	
	.checkbox-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: normal;
		cursor: pointer;
	}
	
	.checkbox-label input[type="checkbox"] {
		width: auto;
		cursor: pointer;
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
	
	.principles {
		margin-bottom: 1rem;
		line-height: 1.8;
	}
	
	.principle-tag {
		display: inline-block;
		background: #e3f2fd;
		color: #0066cc;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		margin-right: 0.5rem;
		margin-top: 0.25rem;
	}
	
	.meta {
		font-size: 0.875rem;
		color: #999;
	}
</style>

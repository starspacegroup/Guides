<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { Pattern } from '$lib/types';
	import Editor from '$lib/components/Editor.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let showForm = $state(false);
	let editingPattern = $state<Pattern | null>(null);
	let createContent = $state('');
	let editContent = $state('');
	
	function getPrincipleNames(principleIds: string[]) {
		return principleIds
			.map(id => data.principles.find(p => p.id === id)?.title)
			.filter(Boolean);
	}
	
	function startEdit(pattern: Pattern) {
		editingPattern = pattern;
		editContent = pattern.content || '';
		showForm = false;
	}
	
	function cancelEdit() {
		editingPattern = null;
		editContent = '';
	}
	
	function toggleForm() {
		showForm = !showForm;
		if (showForm) {
			editingPattern = null;
			createContent = '';
		}
	}
</script>

<div class="container">
	<div class="header">
		<h1>Patterns</h1>
		{#if data.isAuthorized}
			<button onclick={toggleForm} class="btn-primary">
				{showForm ? 'Cancel' : 'Add Pattern'}
			</button>
		{/if}
	</div>

	{#if showForm && data.isAuthorized}
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

			<div class="form-group">
				<label for="content">Detailed Content</label>
				<Editor bind:value={createContent} />
				<input type="hidden" name="content" value={createContent} />
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

	{#if editingPattern && data.isAuthorized}
		<form method="POST" action="?/update" use:enhance class="form-card">
			<input type="hidden" name="id" value={editingPattern.id} />
			
			<div class="form-group">
				<label for="edit-title">Title</label>
				<input
					type="text"
					id="edit-title"
					name="title"
					required
					value={editingPattern.title}
				/>
			</div>
			
			<div class="form-group">
				<label for="edit-description">Description</label>
				<textarea
					id="edit-description"
					name="description"
					required
					rows="4"
					value={editingPattern.description}
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
								checked={editingPattern.principleIds.includes(principle.id)}
							/>
							{principle.title}
						</label>
					{/each}
				</div>
			</div>

			<div class="form-group">
				<label for="edit-content">Detailed Content</label>
				<Editor bind:value={editContent} />
				<input type="hidden" name="content" value={editContent} />
			</div>

			{#if form?.success}
				<div class="success">Pattern updated successfully!</div>
			{/if}
			
			{#if form?.error}
				<div class="error">{form.error}</div>
			{/if}

			<div class="button-group">
				<button type="submit" class="btn-primary">Update Pattern</button>
				<button type="button" onclick={cancelEdit} class="btn-secondary">Cancel</button>
			</div>
		</form>
	{/if}

	<div class="grid">
		{#each data.patterns as pattern (pattern.id)}
			<div class="card">
				<h2><a href="/patterns/{pattern.id}">{pattern.title}</a></h2>
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
				{#if data.isAuthorized}
					<button onclick={() => startEdit(pattern)} class="btn-edit">Edit</button>
				{/if}
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
		color: var(--text-primary);
	}
	
	.btn-primary {
		background: var(--nav-bg);
		color: var(--nav-text);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: background 0.2s;
	}
	
	.btn-primary:hover {
		background: var(--button-hover);
	}
	
	.form-card {
		background: var(--bg-secondary);
		padding: 2rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		border: 1px solid var(--border-primary);
	}
	
	.form-group {
		margin-bottom: 1.5rem;
	}
	
	label, .label-text {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	input[type="text"], textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--border-secondary);
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		box-sizing: border-box;
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	
	input[type="text"]:focus, textarea:focus {
		outline: none;
		border-color: var(--nav-bg);
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
		background: var(--bg-secondary);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border-primary);
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
	
	.card h2 {
		margin: 0 0 1rem 0;
		font-size: 1.3rem;
	}

	.card h2 a {
		color: var(--nav-bg);
		text-decoration: none;
		transition: color 0.2s;
	}

	.card h2 a:hover {
		color: var(--button-hover);
		text-decoration: underline;
	}
	
	.card p {
		margin: 0 0 1rem 0;
		color: var(--text-secondary);
		line-height: 1.6;
	}
	
	.principles {
		margin-bottom: 1rem;
		line-height: 1.8;
	}
	
	.principle-tag {
		display: inline-block;
		background: var(--bg-tertiary);
		color: var(--nav-bg);
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		margin-right: 0.5rem;
		margin-top: 0.25rem;
	}
	
	.meta {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		margin-bottom: 1rem;
	}
	
	.btn-edit {
		background: #28a745;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background 0.2s;
	}
	
	.btn-edit:hover {
		background: #218838;
	}
	
	.btn-secondary {
		background: var(--button-bg);
		color: var(--button-text);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: background 0.2s;
	}
	
	.btn-secondary:hover {
		background: var(--button-hover);
	}
	
	.button-group {
		display: flex;
		gap: 1rem;
	}
</style>

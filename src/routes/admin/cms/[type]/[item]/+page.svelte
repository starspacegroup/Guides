<script lang="ts">
	import { goto } from '$app/navigation';

	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import SharingMeta from '$lib/components/SharingMeta.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	const contentType = data.contentType;
	const editorItem = data.item;
	const tags = data.tags || [];
	const isCreateMode = data.isCreateMode;

	let isLoading = false;
	let errors: Record<string, string> = {};
	let showSeoFields = Boolean(editorItem?.seoTitle || editorItem?.seoDescription || editorItem?.seoImage);

	function getSortedFields() {
		if (!contentType?.fields) return [];
		return [...contentType.fields].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
	}

	function getDefaultFields(): Record<string, any> {
		const defaults: Record<string, any> = {};
		if (contentType?.fields) {
			for (const field of contentType.fields) {
				if (field.defaultValue !== undefined) {
					defaults[field.name] = field.defaultValue;
				} else if (field.type === 'boolean') {
					defaults[field.name] = false;
				} else if (field.type === 'multiselect') {
					defaults[field.name] = [];
				} else if (field.type === 'number') {
					defaults[field.name] = null;
				} else {
					defaults[field.name] = '';
				}
			}
		}
		return defaults;
	}

	const sortedFields = getSortedFields();
	let formTitle = editorItem?.title || '';
	let formSlug = editorItem?.slug || '';
	let formStatus: 'draft' | 'published' | 'archived' = editorItem?.status || 'draft';
	let formFields: Record<string, any> = { ...getDefaultFields(), ...(editorItem?.fields || {}) };
	let formSeoTitle = editorItem?.seoTitle || '';
	let formSeoDescription = editorItem?.seoDescription || '';
	let formSeoImage = editorItem?.seoImage || '';
	let formTagIds: string[] = editorItem?.tags?.map((tag: any) => tag.id) || [];

	function toggleMultiselectValue(fieldName: string, value: string) {
		const current: string[] = formFields[fieldName] || [];
		if (current.includes(value)) {
			formFields[fieldName] = current.filter((entry: string) => entry !== value);
		} else {
			formFields[fieldName] = [...current, value];
		}
	}

	function toggleTag(tagId: string) {
		if (formTagIds.includes(tagId)) {
			formTagIds = formTagIds.filter((id) => id !== tagId);
		} else {
			formTagIds = [...formTagIds, tagId];
		}
	}

	function getBackHref() {
		return `/admin/cms/${contentType.slug}`;
	}

	async function handleSave() {
		errors = {};

		if (!formTitle.trim()) {
			errors.title = 'Title is required';
			return;
		}

		isLoading = true;
		try {
			const body: any = {
				title: formTitle.trim(),
				status: formStatus,
				fields: formFields
			};

			if (formSlug.trim()) {
				body.slug = formSlug.trim();
			}

			if (contentType.settings?.hasSEO !== false) {
				body.seoTitle = formSeoTitle || null;
				body.seoDescription = formSeoDescription || null;
				body.seoImage = formSeoImage || null;
			}

			if (contentType.settings?.hasTags) {
				body.tagIds = formTagIds;
			}

			const endpoint = isCreateMode ? `/api/cms/${contentType.slug}` : `/api/cms/${contentType.slug}/${editorItem.id}`;
			const method = isCreateMode ? 'POST' : 'PUT';

			const response = await fetch(endpoint, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				const errorData = await response.json();
				errors.general = errorData.message || `Failed to ${isCreateMode ? 'create' : 'update'} item`;
				return;
			}

			await goto(getBackHref());
		} catch {
			errors.general = 'An unexpected error occurred';
		} finally {
			isLoading = false;
		}
	}
</script>

<SharingMeta title="{isCreateMode ? 'Create' : 'Edit'} {contentType.name.replace(/s$/, '')} - CMS Admin" noindex={true} />

<div class="cms-item-editor-page">
	<div class="page-header">
		<div class="page-header-left">
			<a href={getBackHref()} class="back-link">Back to {contentType.name}</a>
			<h1>{isCreateMode ? 'Create' : 'Edit'} {contentType.name.replace(/s$/, '')}</h1>
			<p class="page-description">
				{#if isCreateMode}
					Create a new {contentType.name.replace(/s$/, '').toLowerCase()} in a dedicated editor route.
				{:else}
					Update content, SEO, and field data on its own page instead of inside the listing.
				{/if}
			</p>
		</div>
		<div class="page-header-actions">
			<a class="btn btn-secondary" href={getBackHref()}>Cancel</a>
			<button class="btn btn-primary" type="button" on:click={handleSave} disabled={isLoading}>
				{isLoading ? (isCreateMode ? 'Creating...' : 'Saving...') : isCreateMode ? 'Create' : 'Save Changes'}
			</button>
		</div>
	</div>

	<div class="editor-card">
		{#if errors.general}
			<div class="error-banner">{errors.general}</div>
		{/if}

		<div class="form-grid">
			<div class="form-group">
				<label for="form-title">Title <span class="required">*</span></label>
				<input id="form-title" type="text" bind:value={formTitle} class:error={errors.title} placeholder="Enter title..." />
				{#if errors.title}<span class="error-message">{errors.title}</span>{/if}
			</div>

			<div class="form-group">
				<label for="form-slug">Slug</label>
				<input id="form-slug" type="text" bind:value={formSlug} placeholder="auto-generated-from-title" />
				<span class="field-help">Leave empty to auto-generate from title</span>
			</div>

			{#if contentType.settings?.hasDrafts !== false}
				<div class="form-group form-group--compact">
					<label for="form-status">Status</label>
					<select id="form-status" bind:value={formStatus}>
						<option value="draft">Draft</option>
						<option value="published">Published</option>
						<option value="archived">Archived</option>
					</select>
				</div>
			{/if}
		</div>

		{#if contentType.fields?.length}
			<div class="form-section">
				<h2>Content Fields</h2>
				{#each sortedFields as field}
					<div class="form-group">
						<label for="field-{field.name}">{field.label}{#if field.required}<span class="required">*</span>{/if}</label>
						{#if field.type === 'url'}
							<input id="field-{field.name}" type="url" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} />
						{:else if field.type === 'email'}
							<input id="field-{field.name}" type="email" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} />
						{:else if field.type === 'color'}
							<input id="field-{field.name}" type="color" bind:value={formFields[field.name]} />
						{:else if field.type === 'text'}
							<input id="field-{field.name}" type="text" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} />
						{:else if field.type === 'number'}
							<input id="field-{field.name}" type="number" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} min={field.validation?.min} max={field.validation?.max} />
						{:else if field.type === 'textarea'}
							<textarea id="field-{field.name}" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} rows="4"></textarea>
						{:else if field.type === 'richtext'}
							<RichTextEditor label={field.label} bind:value={formFields[field.name]} placeholder={field.placeholder || 'Write the main content here...'} helpText={field.helpText || 'Compose in a full-page workspace with images, tables, links, and language-aware code blocks.'} />
						{:else if field.type === 'boolean'}
							<label class="checkbox-label"><input id="field-{field.name}" type="checkbox" bind:checked={formFields[field.name]} /><span>{field.helpText || 'Enable'}</span></label>
						{:else if field.type === 'select'}
							<select id="field-{field.name}" bind:value={formFields[field.name]}><option value="">Select...</option>{#each field.options || [] as opt}<option value={opt.value}>{opt.label}</option>{/each}</select>
						{:else if field.type === 'multiselect'}
							<div class="multiselect-group">{#each field.options || [] as opt}<label class="checkbox-label"><input type="checkbox" checked={formFields[field.name]?.includes(opt.value)} on:change={() => toggleMultiselectValue(field.name, opt.value)} /><span>{opt.label}</span></label>{/each}</div>
						{:else if field.type === 'date'}
							<input id="field-{field.name}" type="date" bind:value={formFields[field.name]} />
						{:else if field.type === 'datetime'}
							<input id="field-{field.name}" type="datetime-local" bind:value={formFields[field.name]} />
						{:else if field.type === 'image'}
							<input id="field-{field.name}" type="url" bind:value={formFields[field.name]} placeholder={field.placeholder || 'https://example.com/image.jpg'} />
						{:else if field.type === 'json'}
							<textarea id="field-{field.name}" bind:value={formFields[field.name]} placeholder={"{\"key\": \"value\"}"} rows="5" class="json-field"></textarea>
						{:else}
							<input id="field-{field.name}" type="text" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} />
						{/if}
						{#if field.helpText && field.type !== 'boolean' && field.type !== 'richtext'}<span class="field-help">{field.helpText}</span>{/if}
					</div>
				{/each}
			</div>
		{/if}

		{#if contentType.settings?.hasTags && tags.length > 0}
			<div class="form-section">
				<h2>Tags</h2>
				<div class="tag-select">{#each tags as tag}<button class="tag-toggle" class:selected={formTagIds.includes(tag.id)} type="button" on:click={() => toggleTag(tag.id)}>{tag.name}</button>{/each}</div>
			</div>
		{/if}

		{#if contentType.settings?.hasSEO !== false}
			<div class="form-section">
				<button class="section-toggle" type="button" on:click={() => (showSeoFields = !showSeoFields)}>SEO Settings</button>
				{#if showSeoFields}
					<div class="seo-fields">
						<div class="form-group"><label for="seo-title">SEO Title</label><input id="seo-title" type="text" bind:value={formSeoTitle} placeholder="Page title for search engines" /></div>
						<div class="form-group"><label for="seo-description">SEO Description</label><textarea id="seo-description" bind:value={formSeoDescription} placeholder="Brief description for search engine results" rows="3"></textarea></div>
						<div class="form-group"><label for="seo-image">SEO Image URL</label><input id="seo-image" type="url" bind:value={formSeoImage} placeholder="https://example.com/og-image.jpg" /></div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.cms-item-editor-page { display: grid; gap: var(--spacing-lg); max-width: 1080px; }
	.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--spacing-md); }
	.page-header-left { display: grid; gap: var(--spacing-xs); }
	.back-link { color: var(--color-text-secondary); text-decoration: none; font-size: 0.8125rem; }
	.back-link:hover { color: var(--color-primary); }
	.page-description { color: var(--color-text-secondary); }
	.page-header-actions { display: flex; gap: var(--spacing-sm); align-items: center; }
	.editor-card { padding: var(--spacing-lg); border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-background); }
	.form-grid { display: grid; gap: var(--spacing-md); grid-template-columns: minmax(0, 1fr); }
	.form-group { margin-bottom: var(--spacing-md); }
	.form-group label { display: block; font-size: 0.8125rem; font-weight: 500; color: var(--color-text); margin-bottom: var(--spacing-xs); }
	.form-group input[type='text'], .form-group input[type='url'], .form-group input[type='email'], .form-group input[type='number'], .form-group input[type='date'], .form-group input[type='datetime-local'], .form-group textarea, .form-group select { width: 100%; padding: var(--spacing-sm) var(--spacing-md); background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.875rem; font-family: inherit; }
	.form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: var(--color-primary); outline: none; }
	.form-group input.error { border-color: var(--color-danger, #dc3545); }
	.form-group input::placeholder, .form-group textarea::placeholder { color: var(--color-text-secondary); }
	.form-group input[type='color'] { width: 48px; height: 36px; padding: 2px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface); cursor: pointer; }
	.json-field { font-family: var(--font-mono); font-size: 0.8125rem; }
	.field-help { display: block; font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.25rem; }
	.required, .error-message { color: var(--color-danger, #dc3545); }
	.error-message { display: block; font-size: 0.75rem; margin-top: 0.25rem; }
	.error-banner { background: color-mix(in srgb, var(--color-danger, #dc3545) 10%, var(--color-surface)); border: 1px solid var(--color-danger, #dc3545); color: var(--color-danger, #dc3545); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-md); font-size: 0.875rem; margin-bottom: var(--spacing-md); }
	.form-section { margin-top: var(--spacing-xl); padding-top: var(--spacing-lg); border-top: 1px solid var(--color-border); }
	.form-section h2 { font-size: 1rem; font-weight: 600; margin-bottom: var(--spacing-md); }
	.section-toggle { background: none; border: none; padding: 0; font: inherit; font-weight: 600; cursor: pointer; color: var(--color-text); margin-bottom: var(--spacing-md); }
	.section-toggle:hover { color: var(--color-primary); }
	.seo-fields { padding-left: var(--spacing-md); }
	.checkbox-label { display: inline-flex; align-items: center; gap: var(--spacing-sm); cursor: pointer; }
	.multiselect-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
	.tag-select { display: flex; flex-wrap: wrap; gap: var(--spacing-xs); }
	.tag-toggle { padding: 0.25rem var(--spacing-sm); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface); color: var(--color-text-secondary); font-size: 0.8125rem; cursor: pointer; }
	.tag-toggle.selected { background: var(--color-primary); color: var(--color-background); border-color: var(--color-primary); }
	.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--spacing-xs); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 500; cursor: pointer; border: 1px solid transparent; text-decoration: none; }
	.btn:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-primary { background: var(--color-primary); color: var(--color-background); }
	.btn-secondary { background: var(--color-surface); color: var(--color-text); border-color: var(--color-border); }
	@media (min-width: 840px) { .form-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 12rem; align-items: start; } .form-group--compact { max-width: 12rem; } }
	@media (max-width: 839px) { .page-header { flex-direction: column; } .page-header-actions { width: 100%; } .page-header-actions .btn { flex: 1; } }
</style>
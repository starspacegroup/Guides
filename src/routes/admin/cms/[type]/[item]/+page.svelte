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
	const primaryRichTextField = sortedFields.find((field) => field.type === 'richtext') || null;
	const inspectorFields = sortedFields.filter((field) => field.name !== primaryRichTextField?.name);
	const hasPrimaryEditor = Boolean(primaryRichTextField);

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

	function getPageTitle() {
		return `${isCreateMode ? 'Create' : 'Edit'} ${contentType.name.replace(/s$/, '')}`;
	}

	function getPageDescription() {
		if (isCreateMode) {
			return `Create a new ${contentType.name.replace(/s$/, '').toLowerCase()} with the writing canvas front and center.`;
		}

		return 'Focus on the live body first, then refine metadata and publishing details from the side panel.';
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

<SharingMeta title="{getPageTitle()} - CMS Admin" noindex={true} />

<div class="cms-editor-app" class:cms-editor-app--fallback={!hasPrimaryEditor}>
	<header class="editor-app__topbar">
		<div class="editor-app__title-block">
			<a href={getBackHref()} class="back-link">Back to {contentType.name}</a>
			<div>
				<h1>{getPageTitle()}</h1>
				<p class="page-description">{getPageDescription()}</p>
			</div>
		</div>
		<div class="page-header-actions">
			<a class="btn btn-secondary" href={getBackHref()}>Cancel</a>
			<button class="btn btn-primary" type="button" on:click={handleSave} disabled={isLoading}>
				{isLoading ? (isCreateMode ? 'Creating...' : 'Saving...') : isCreateMode ? 'Create' : 'Save Changes'}
			</button>
		</div>
	</header>

	{#if errors.general}
		<div class="error-banner">{errors.general}</div>
	{/if}

	<section class="editor-app__meta-strip" aria-label="Publishing controls">
		<div class="app-field app-field--title">
			<label for="form-title">Title <span class="required">*</span></label>
			<input id="form-title" type="text" bind:value={formTitle} class:error={errors.title} placeholder="Enter title..." />
			{#if errors.title}<span class="error-message">{errors.title}</span>{/if}
		</div>

		<div class="app-field">
			<label for="form-slug">Slug</label>
			<input id="form-slug" type="text" bind:value={formSlug} placeholder="auto-generated-from-title" />
			<span class="field-help">Leave empty to auto-generate from title</span>
		</div>

		{#if contentType.settings?.hasDrafts !== false}
			<div class="app-field app-field--status">
				<label for="form-status">Status</label>
				<select id="form-status" bind:value={formStatus}>
					<option value="draft">Draft</option>
					<option value="published">Published</option>
					<option value="archived">Archived</option>
				</select>
			</div>
		{/if}
	</section>

	<div class="editor-app__workspace">
		<section class="editor-app__main">
			<div class="editor-app__main-header">
				<div>
					<span class="editor-app__eyebrow">Writing space</span>
					<h2>{primaryRichTextField?.label || 'Content'}</h2>
				</div>
				<p>
					{#if primaryRichTextField}
						{primaryRichTextField.helpText || 'Work in the live canvas first. Supporting fields stay out of the way until you need them.'}
					{:else}
						This content type has no primary rich text field, so the editor falls back to the structured fields below.
					{/if}
				</p>
			</div>

			{#if primaryRichTextField}
				<RichTextEditor
					label={primaryRichTextField.label}
					bind:value={formFields[primaryRichTextField.name]}
					placeholder={primaryRichTextField.placeholder || 'Write the main content here...'}
					helpText={primaryRichTextField.helpText || 'Compose in a full-page workspace with images, tables, links, and language-aware code blocks.'}
					showIntro={false}
				/>
			{:else}
				<div class="editor-app__fallback-fields">
					{#each sortedFields as field}
						<div class="form-group">
							<label for={`field-${field.name}`}>{field.label}{#if field.required}<span class="required">*</span>{/if}</label>
							{#if field.type === 'url'}
								<input id={`field-${field.name}`} type="url" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} />
							{:else if field.type === 'email'}
								<input id={`field-${field.name}`} type="email" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} />
							{:else if field.type === 'color'}
								<input id={`field-${field.name}`} type="color" bind:value={formFields[field.name]} />
							{:else if field.type === 'text'}
								<input id={`field-${field.name}`} type="text" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} />
							{:else if field.type === 'number'}
								<input id={`field-${field.name}`} type="number" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} min={field.validation?.min} max={field.validation?.max} />
							{:else if field.type === 'textarea'}
								<textarea id={`field-${field.name}`} bind:value={formFields[field.name]} placeholder={field.placeholder || ''} rows="6"></textarea>
							{:else if field.type === 'boolean'}
								<label class="checkbox-label"><input id={`field-${field.name}`} type="checkbox" bind:checked={formFields[field.name]} /><span>{field.helpText || 'Enable'}</span></label>
							{:else if field.type === 'select'}
								<select id={`field-${field.name}`} bind:value={formFields[field.name]}><option value="">Select...</option>{#each field.options || [] as opt}<option value={opt.value}>{opt.label}</option>{/each}</select>
							{:else if field.type === 'multiselect'}
								<div class="multiselect-group">{#each field.options || [] as opt}<label class="checkbox-label"><input type="checkbox" checked={formFields[field.name]?.includes(opt.value)} on:change={() => toggleMultiselectValue(field.name, opt.value)} /><span>{opt.label}</span></label>{/each}</div>
							{:else if field.type === 'date'}
								<input id={`field-${field.name}`} type="date" bind:value={formFields[field.name]} />
							{:else if field.type === 'datetime'}
								<input id={`field-${field.name}`} type="datetime-local" bind:value={formFields[field.name]} />
							{:else if field.type === 'image'}
								<input id={`field-${field.name}`} type="url" bind:value={formFields[field.name]} placeholder={field.placeholder || 'https://example.com/image.jpg'} />
							{:else if field.type === 'json'}
								<textarea id={`field-${field.name}`} bind:value={formFields[field.name]} placeholder={'{"key": "value"}'} rows="5" class="json-field"></textarea>
							{:else}
								<input id={`field-${field.name}`} type="text" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} />
							{/if}
							{#if field.helpText && field.type !== 'boolean'}<span class="field-help">{field.helpText}</span>{/if}
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<aside class="editor-app__inspector" aria-label="Entry details">
			{#if inspectorFields.length > 0}
				<section class="editor-app__panel">
					<h3>Entry details</h3>
					<p class="panel-copy">Keep supporting fields nearby without taking focus away from the guide body.</p>
					{#each inspectorFields as field}
						<div class="form-group">
							<label for={`field-${field.name}`}>{field.label}{#if field.required}<span class="required">*</span>{/if}</label>
							{#if field.type === 'url'}
								<input id={`field-${field.name}`} type="url" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} />
							{:else if field.type === 'email'}
								<input id={`field-${field.name}`} type="email" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} />
							{:else if field.type === 'color'}
								<input id={`field-${field.name}`} type="color" bind:value={formFields[field.name]} />
							{:else if field.type === 'text'}
								<input id={`field-${field.name}`} type="text" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} />
							{:else if field.type === 'number'}
								<input id={`field-${field.name}`} type="number" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} min={field.validation?.min} max={field.validation?.max} />
							{:else if field.type === 'textarea'}
								<textarea id={`field-${field.name}`} bind:value={formFields[field.name]} placeholder={field.placeholder || ''} rows="5"></textarea>
							{:else if field.type === 'richtext'}
								<RichTextEditor label={field.label} bind:value={formFields[field.name]} placeholder={field.placeholder || 'Write the main content here...'} helpText={field.helpText || 'Compose in the live editor.'} />
							{:else if field.type === 'boolean'}
								<label class="checkbox-label"><input id={`field-${field.name}`} type="checkbox" bind:checked={formFields[field.name]} /><span>{field.helpText || 'Enable'}</span></label>
							{:else if field.type === 'select'}
								<select id={`field-${field.name}`} bind:value={formFields[field.name]}><option value="">Select...</option>{#each field.options || [] as opt}<option value={opt.value}>{opt.label}</option>{/each}</select>
							{:else if field.type === 'multiselect'}
								<div class="multiselect-group">{#each field.options || [] as opt}<label class="checkbox-label"><input type="checkbox" checked={formFields[field.name]?.includes(opt.value)} on:change={() => toggleMultiselectValue(field.name, opt.value)} /><span>{opt.label}</span></label>{/each}</div>
							{:else if field.type === 'date'}
								<input id={`field-${field.name}`} type="date" bind:value={formFields[field.name]} />
							{:else if field.type === 'datetime'}
								<input id={`field-${field.name}`} type="datetime-local" bind:value={formFields[field.name]} />
							{:else if field.type === 'image'}
								<input id={`field-${field.name}`} type="url" bind:value={formFields[field.name]} placeholder={field.placeholder || 'https://example.com/image.jpg'} />
							{:else if field.type === 'json'}
								<textarea id={`field-${field.name}`} bind:value={formFields[field.name]} placeholder={'{"key": "value"}'} rows="5" class="json-field"></textarea>
							{:else}
								<input id={`field-${field.name}`} type="text" bind:value={formFields[field.name]} placeholder={field.placeholder || ''} />
							{/if}
							{#if field.helpText && field.type !== 'boolean' && field.type !== 'richtext'}<span class="field-help">{field.helpText}</span>{/if}
						</div>
					{/each}
				</section>
			{/if}

			{#if contentType.settings?.hasTags && tags.length > 0}
				<section class="editor-app__panel">
					<h3>Tags</h3>
					<div class="tag-select">{#each tags as tag}<button class="tag-toggle" class:selected={formTagIds.includes(tag.id)} type="button" on:click={() => toggleTag(tag.id)}>{tag.name}</button>{/each}</div>
				</section>
			{/if}

			{#if contentType.settings?.hasSEO !== false}
				<section class="editor-app__panel">
					<button class="section-toggle" type="button" on:click={() => (showSeoFields = !showSeoFields)}>SEO Settings</button>
					{#if showSeoFields}
						<div class="seo-fields">
							<div class="form-group"><label for="seo-title">SEO Title</label><input id="seo-title" type="text" bind:value={formSeoTitle} placeholder="Page title for search engines" /></div>
							<div class="form-group"><label for="seo-description">SEO Description</label><textarea id="seo-description" bind:value={formSeoDescription} placeholder="Brief description for search engine results" rows="3"></textarea></div>
							<div class="form-group"><label for="seo-image">SEO Image URL</label><input id="seo-image" type="url" bind:value={formSeoImage} placeholder="https://example.com/og-image.jpg" /></div>
						</div>
					{/if}
				</section>
			{/if}
		</aside>
	</div>
</div>

<style>
	.cms-editor-app {
		display: grid;
		gap: var(--spacing-md);
		min-height: 100vh;
		width: 100%;
		padding: var(--spacing-lg) var(--spacing-2xl) var(--spacing-2xl);
		background:
			radial-gradient(circle at top left, color-mix(in srgb, var(--color-primary) 10%, var(--color-background)) 0%, transparent 30%),
			linear-gradient(180deg, color-mix(in srgb, var(--color-background) 94%, var(--color-surface)) 0%, var(--color-background) 100%);
	}

	.cms-editor-app--fallback {
		width: 100%;
		margin: 0;
		padding-inline: var(--spacing-2xl);
	}

	.editor-app__topbar,
	.editor-app__meta-strip,
	.editor-app__main,
	.editor-app__panel {
		border: 1px solid color-mix(in srgb, var(--color-border) 86%, var(--color-background));
		border-radius: var(--radius-xl);
		background: color-mix(in srgb, var(--color-surface) 94%, var(--color-background));
	}

	.editor-app__topbar,
	.editor-app__meta-strip,
	.editor-app__main,
	.editor-app__panel {
		padding: var(--spacing-md);
	}

	.editor-app__topbar,
	.editor-app__workspace,
	.editor-app__main,
	.editor-app__main-header,
	.editor-app__inspector,
	.editor-app__panel,
	.editor-app__title-block,
	.editor-app__meta-strip,
	.app-field,
	.seo-fields {
		display: grid;
		gap: var(--spacing-sm);
	}

	.editor-app__topbar {
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: start;
		position: sticky;
		top: 0;
		z-index: 4;
		backdrop-filter: blur(14px);
	}

	.editor-app__title-block h1,
	.editor-app__main-header h2 {
		margin: 0;
	}

	.editor-app__title-block h1 {
		font-size: clamp(1.7rem, 2.6vw, 2.6rem);
		line-height: 0.98;
	}

	.editor-app__main-header h2 {
		font-size: 1.2rem;
	}

	.editor-app__eyebrow,
		.back-link {
		font-size: 0.8125rem;
	}

	.editor-app__eyebrow {
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-primary);
	}

	.back-link,
	.page-description,
	.panel-copy,
	.field-help,
	.editor-app__main-header p {
		color: var(--color-text-secondary);
	}

	.back-link {
		text-decoration: none;
	}

	.back-link:hover,
	.section-toggle:hover {
		color: var(--color-primary);
	}

	.page-header-actions {
		display: flex;
		gap: var(--spacing-sm);
		align-items: center;
	}

	.editor-app__meta-strip {
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		align-items: start;
	}

	.editor-app__workspace {
		grid-template-columns: minmax(0, 1fr) minmax(18rem, 22rem);
		align-items: start;
		min-height: 0;
		gap: var(--spacing-md);
	}

	.editor-app__main {
		grid-template-rows: auto minmax(0, 1fr);
		min-height: calc(100vh - 16rem);
	}

	.editor-app__inspector {
		align-content: start;
		position: sticky;
		top: 8.5rem;
		gap: 0.75rem;
	}

	.editor-app__panel h3 {
		margin: 0;
		font-size: 1rem;
	}

	.form-group,
	.app-field {
		margin: 0;
	}

	.form-group label,
	.app-field label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text);
		margin-bottom: var(--spacing-xs);
	}

	.form-group input[type='text'],
	.form-group input[type='url'],
	.form-group input[type='email'],
	.form-group input[type='number'],
	.form-group input[type='date'],
	.form-group input[type='datetime-local'],
	.form-group textarea,
	.form-group select,
	.app-field input,
	.app-field select {
		width: 100%;
		padding: 0.7rem 0.8rem;
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-family: inherit;
	}

	.form-group input:focus,
	.form-group textarea:focus,
	.form-group select:focus,
	.app-field input:focus,
	.app-field select:focus {
		border-color: var(--color-primary);
		outline: none;
	}

	.app-field input.error {
		border-color: var(--color-danger, #dc3545);
	}

	.form-group input::placeholder,
	.form-group textarea::placeholder,
	.app-field input::placeholder {
		color: var(--color-text-secondary);
	}

	.form-group input[type='color'] {
		width: 48px;
		height: 36px;
		padding: 2px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		cursor: pointer;
	}

	.json-field {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
	}

	.field-help {
		display: block;
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}

	.required,
	.error-message {
		color: var(--color-danger, #dc3545);
	}

	.error-message {
		display: block;
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}

	.error-banner {
		background: color-mix(in srgb, var(--color-danger, #dc3545) 10%, var(--color-surface));
		border: 1px solid var(--color-danger, #dc3545);
		color: var(--color-danger, #dc3545);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}

	.section-toggle {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
		color: var(--color-text);
		text-align: left;
	}

	.checkbox-label {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		cursor: pointer;
	}

	.multiselect-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.tag-select {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.tag-toggle {
		padding: 0.25rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.tag-toggle.selected {
		background: var(--color-primary);
		color: var(--color-background);
		border-color: var(--color-primary);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid transparent;
		text-decoration: none;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background: var(--color-primary);
		color: var(--color-background);
	}

	.btn-secondary {
		background: var(--color-surface);
		color: var(--color-text);
		border-color: var(--color-border);
	}

	@media (max-width: 959px) {
		.editor-app__topbar,
		.editor-app__meta-strip,
		.editor-app__workspace {
			grid-template-columns: minmax(0, 1fr);
		}

		.editor-app__main {
			min-height: auto;
		}

		.editor-app__inspector {
			position: static;
		}
	}

	@media (max-width: 768px) {
		.cms-editor-app {
			padding: var(--spacing-md);
		}

		.cms-editor-app--fallback {
			width: 100%;
			margin: 0;
			padding: 0;
		}

		.editor-app__topbar {
			position: static;
		}

		.page-header-actions {
			width: 100%;
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.page-header-actions .btn {
			width: 100%;
		}
	}
</style>

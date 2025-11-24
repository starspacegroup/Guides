<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { theme, getSystemTheme } from '$lib/theme';

	let { children, data } = $props();

	let dropdownOpen = $state(false);
	let currentTheme = $state($theme.current);

	// Initialize theme on mount
	onMount(() => {
		const initialTheme = data.theme || getSystemTheme();
		theme.initialize(initialTheme);
		
		// Subscribe to theme changes
		const unsubscribe = theme.subscribe(state => {
			currentTheme = state.current;
		});
		
		return unsubscribe;
	});

	const handleSignIn = () => {
		window.location.href = '/auth/login';
	};

	const handleSignOut = async () => {
		await fetch('/auth/logout', { method: 'POST' });
		window.location.href = '/';
	};

	const toggleDropdown = () => {
		dropdownOpen = !dropdownOpen;
	};

	const toggleTheme = () => {
		theme.toggle();
	};

	// Close dropdown when clicking outside
	const handleClickOutside = (event: MouseEvent) => {
		const target = event.target as HTMLElement;
		if (!target.closest('.user-dropdown-container')) {
			dropdownOpen = false;
		}
	};


</script>

<svelte:window onclick={handleClickOutside} />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav>
	<a href="/" class="logo">*Space Atlas</a>
	<div class="nav-links">
		<a href="/principles">Principles</a>
		<a href="/patterns">Patterns</a>
	</div>
	<div class="auth-section">
		<button onclick={toggleTheme} class="theme-toggle" aria-label="Toggle theme" title="Toggle theme">
			{#if currentTheme === 'dark'}
				<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
					<path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
					<path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6.75a9 9 0 009 9 8.97 8.97 0 003.213-.69.75.75 0 01.977.977 10.5 10.5 0 01-9.44 5.213 10.5 10.5 0 01-10.5-10.5 10.5 10.5 0 015.213-9.44.75.75 0 01.819.162z" />
				</svg>
			{/if}
		</button>
		{#if data.session?.user}
			<div class="user-dropdown-container">
				<button onclick={toggleDropdown} class="user-avatar-button" aria-label="User menu">
					{#if data.session.user.image}
						<img src={data.session.user.image} alt={data.session.user.name || 'User'} class="user-avatar" />
					{:else}
						<div class="user-avatar-placeholder">
							{(data.session.user.name || data.session.user.email || 'U').charAt(0).toUpperCase()}
						</div>
					{/if}
				</button>
				
				{#if dropdownOpen}
					<div class="dropdown-menu">
						<div class="dropdown-header">
							<div class="dropdown-user-name">{data.session.user.name || 'User'}</div>
							<div class="dropdown-user-email">{data.session.user.email}</div>
						</div>
						<div class="dropdown-divider"></div>
						{#if data.isAdmin}
							<a href="/admin" class="dropdown-item">
								<svg class="dropdown-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
									<path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.75.75 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"></path>
								</svg>
								Admin Dashboard
							</a>
							<div class="dropdown-divider"></div>
						{/if}
						<button onclick={handleSignOut} class="dropdown-item">
							<svg class="dropdown-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
								<path d="M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 0 1 0 1.5h-2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 0 1.5h-2.5A1.75 1.75 0 0 1 2 13.25Zm6.56 4.5 1.97-1.97a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.53 8l2.06 2.06a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-1.97-1.97-.345.345a.75.75 0 0 1-1.06 0l-.345-.345-1.97 1.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L6.47 8 4.41 5.94a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l1.97 1.97.345-.345a.75.75 0 0 1 1.06 0l.345.345Z"></path>
							</svg>
							Sign Out
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<button onclick={handleSignIn} class="github-signin-button">
				<svg class="github-icon" viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
					<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
				</svg>
				Sign in with GitHub
			</button>
		{/if}
	</div>
</nav>

{@render children()}

<style>
	:global(:root) {
		/* Light theme colors */
		--bg-primary: #ffffff;
		--bg-secondary: #f6f8fa;
		--bg-tertiary: #f0f3f5;
		--text-primary: #24292e;
		--text-secondary: #586069;
		--text-tertiary: #6a737d;
		--border-primary: #e1e4e8;
		--border-secondary: #d1d5da;
		--nav-bg: #0066cc;
		--nav-text: #ffffff;
		--nav-hover: rgba(255, 255, 255, 0.1);
		--button-bg: #24292e;
		--button-hover: #2f363d;
		--button-text: #ffffff;
		--dropdown-bg: #ffffff;
		--dropdown-hover: #f6f8fa;
		--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
		--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
		--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);
	}

	:global([data-theme="dark"]) {
		/* Dark theme colors */
		--bg-primary: #0d1117;
		--bg-secondary: #161b22;
		--bg-tertiary: #1c2128;
		--text-primary: #c9d1d9;
		--text-secondary: #8b949e;
		--text-tertiary: #6e7681;
		--border-primary: #30363d;
		--border-secondary: #21262d;
		--nav-bg: #0d47a1;
		--nav-text: #ffffff;
		--nav-hover: rgba(255, 255, 255, 0.15);
		--button-bg: #21262d;
		--button-hover: #30363d;
		--button-text: #c9d1d9;
		--dropdown-bg: #161b22;
		--dropdown-hover: #1c2128;
		--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.5);
		--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.6);
		--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.7);
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		line-height: 1.6;
		background: var(--bg-primary);
		color: var(--text-primary);
		transition: background-color 0.2s ease, color 0.2s ease;
	}
	
	nav {
		background: var(--nav-bg);
		color: var(--nav-text);
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: background-color 0.2s ease;
	}
	
	.logo {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--nav-text);
		text-decoration: none;
	}
	
	.nav-links {
		display: flex;
		gap: 1.5rem;
	}
	
	.nav-links a {
		color: var(--nav-text);
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: background 0.2s;
	}
	
	.nav-links a:hover {
		background: var(--nav-hover);
	}

	.auth-section {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.theme-toggle {
		background: transparent;
		border: 1px solid var(--nav-hover);
		color: var(--nav-text);
		padding: 0.5rem;
		border-radius: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.theme-toggle:hover {
		background: var(--nav-hover);
		transform: scale(1.05);
	}

	.theme-toggle svg {
		display: block;
	}

	.user-dropdown-container {
		position: relative;
	}

	.user-avatar-button {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		border-radius: 50%;
		transition: opacity 0.2s ease;
	}

	.user-avatar-button:hover {
		opacity: 0.8;
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 2px solid var(--nav-text);
		display: block;
	}

	.user-avatar-placeholder {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 2px solid var(--nav-text);
		background: var(--nav-hover);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.1rem;
		color: var(--nav-text);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		background: var(--dropdown-bg);
		border: 1px solid var(--border-primary);
		border-radius: 8px;
		box-shadow: var(--shadow-md);
		min-width: 200px;
		z-index: 1000;
		overflow: hidden;
		animation: dropdownFadeIn 0.15s ease-out;
	}

	@keyframes dropdownFadeIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-header {
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-primary);
	}

	.dropdown-user-name {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.95rem;
		margin-bottom: 4px;
	}

	.dropdown-user-email {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.dropdown-divider {
		height: 1px;
		background: var(--border-primary);
		margin: 4px 0;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 10px 16px;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		color: var(--text-primary);
		font-size: 0.9rem;
		text-decoration: none;
		transition: background 0.15s ease;
	}

	.dropdown-item:hover {
		background: var(--dropdown-hover);
	}

	.dropdown-icon {
		flex-shrink: 0;
		color: var(--text-secondary);
	}

	.github-signin-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--button-bg);
		color: var(--button-text);
		border: 1px solid var(--border-primary);
		padding: 0.6rem 1.2rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.95rem;
		transition: all 0.2s ease;
		box-shadow: var(--shadow-sm);
	}

	.github-signin-button:hover {
		background: var(--button-hover);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.github-signin-button:active {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.github-icon {
		flex-shrink: 0;
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	let status = $state('Clearing authentication state...');
	let cleared = $state<string[]>([]);

	onMount(async () => {
		if (browser) {
			// Clear localStorage
			const localStorageKeys = Object.keys(localStorage);
			const authKeys = localStorageKeys.filter(k => 
				k.includes('auth') || k.includes('oauth') || k.includes('github')
			);
			authKeys.forEach(key => {
				localStorage.removeItem(key);
				cleared.push(`localStorage: ${key}`);
			});

			// Clear sessionStorage
			const sessionStorageKeys = Object.keys(sessionStorage);
			const authSessionKeys = sessionStorageKeys.filter(k => 
				k.includes('auth') || k.includes('oauth') || k.includes('github')
			);
			authSessionKeys.forEach(key => {
				sessionStorage.removeItem(key);
				cleared.push(`sessionStorage: ${key}`);
			});

			// Clear cookies via API
			try {
				const response = await fetch('/api/clear-auth', { method: 'POST' });
				const data = await response.json();
				cleared.push(`Cleared ${data.cleared} cookies via server`);
			} catch (error) {
				cleared.push('Error clearing cookies: ' + error);
			}

			// Clear all document cookies from client side
			const cookies = document.cookie.split(';');
			for (let cookie of cookies) {
				const name = cookie.split('=')[0].trim();
				if (name.includes('auth') || name.includes('next-auth')) {
					document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`;
					cleared.push(`Client cookie: ${name}`);
				}
			}

			status = 'Done! Redirecting to home...';
			
			setTimeout(() => {
				goto('/');
			}, 2000);
		}
	});
</script>

<div class="container">
	<h1>🧹 Clearing Authentication State</h1>
	<p class="status">{status}</p>
	
	{#if cleared.length > 0}
		<div class="cleared-list">
			<h3>Cleared items:</h3>
			<ul>
				{#each cleared as item}
					<li>{item}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 600px;
		margin: 4rem auto;
		padding: 2rem;
		text-align: center;
	}

	h1 {
		color: var(--nav-bg);
		margin-bottom: 1rem;
	}

	.status {
		font-size: 1.2rem;
		color: var(--text-secondary);
		margin: 2rem 0;
	}

	.cleared-list {
		text-align: left;
		background: var(--bg-secondary);
		padding: 1rem;
		border-radius: 8px;
		margin-top: 2rem;
	}

	.cleared-list h3 {
		margin-top: 0;
		color: var(--text-primary);
	}

	.cleared-list ul {
		list-style: none;
		padding: 0;
	}

	.cleared-list li {
		padding: 0.5rem;
		border-bottom: 1px solid var(--border-primary);
		font-family: monospace;
		font-size: 0.9rem;
		color: var(--text-secondary);
	}

	.cleared-list li:last-child {
		border-bottom: none;
	}
</style>

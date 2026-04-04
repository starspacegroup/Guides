<script lang="ts">
	import ThemeToggleNextActionDemo from './ThemeToggleNextActionDemo.svelte';

	export let demo: string | null = null;
</script>

{#if demo === 'theme-toggle-next-action'}
	<ThemeToggleNextActionDemo />
{/if}
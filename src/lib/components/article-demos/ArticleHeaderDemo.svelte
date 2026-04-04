<script lang="ts">
	import InlineEditVsFormDemo from './InlineEditVsFormDemo.svelte';
	import ModalDialogFocusDemo from './ModalDialogFocusDemo.svelte';
	import NotificationBadgeDemo from './NotificationBadgeDemo.svelte';
	import TableSortingPaginationDemo from './TableSortingPaginationDemo.svelte';
	import ThemeToggleNextActionDemo from './ThemeToggleNextActionDemo.svelte';
	import TooltipPopoverDemo from './TooltipPopoverDemo.svelte';

	export let demo: string | null = null;
</script>

{#if demo === 'theme-toggle-next-action'}
	<ThemeToggleNextActionDemo />
{:else if demo === 'modal-dialog-focus-and-close'}
	<ModalDialogFocusDemo />
{:else if demo === 'inline-edit-vs-form'}
	<InlineEditVsFormDemo />
{:else if demo === 'notification-badge-behavior'}
	<NotificationBadgeDemo />
{:else if demo === 'table-sorting-pagination'}
	<TableSortingPaginationDemo />
{:else if demo === 'tooltip-vs-popover'}
	<TooltipPopoverDemo />
{/if}
import ModalDialogFocusDemo from '$lib/components/article-demos/ModalDialogFocusDemo.svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

describe('ModalDialogFocusDemo', () => {
	it('opens a dialog, moves focus inside, and restores focus when closed with Escape', async () => {
		render(ModalDialogFocusDemo);

		const trigger = screen.getByRole('button', { name: 'Open modal example' });
		trigger.focus();

		await fireEvent.click(trigger);
		await tick();

		const dialog = screen.getByRole('dialog', { name: 'Delete project' });
		const closeButton = screen.getByRole('button', { name: 'Close dialog' });

		expect(dialog).toBeInTheDocument();
		expect(document.activeElement).toBe(closeButton);

		await fireEvent.keyDown(window, { key: 'Escape' });
		await tick();

		expect(screen.queryByRole('dialog', { name: 'Delete project' })).not.toBeInTheDocument();
		expect(document.activeElement).toBe(trigger);
	});

	it('keeps tab focus inside the dialog', async () => {
		render(ModalDialogFocusDemo);

		await fireEvent.click(screen.getByRole('button', { name: 'Open modal example' }));
		await tick();

		const closeButton = screen.getByRole('button', { name: 'Close dialog' });
		const keepEditingButton = screen.getByRole('button', { name: 'Keep editing' });

		keepEditingButton.focus();
		await fireEvent.keyDown(window, { key: 'Tab' });
		await tick();

		expect(document.activeElement).toBe(closeButton);
	});
});
import TooltipPopoverDemo from '$lib/components/article-demos/TooltipPopoverDemo.svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

describe('TooltipPopoverDemo', () => {
  it('associates the tooltip trigger with tooltip content', async () => {
    render(TooltipPopoverDemo);

    const tooltipTrigger = screen.getByRole('button', { name: 'Show tooltip help' });
    await fireEvent.focus(tooltipTrigger);

    const tooltip = screen.getByRole('tooltip');

    expect(tooltipTrigger).toHaveAttribute('aria-describedby', tooltip.id);
  });

  it('wires the popover trigger to its panel and restores focus on Escape', async () => {
    render(TooltipPopoverDemo);

    const popoverTrigger = screen.getByRole('button', { name: 'Formatting options' });
    popoverTrigger.focus();

    await fireEvent.click(popoverTrigger);
    await tick();

    const popover = screen.getByRole('dialog', { name: 'Formatting actions' });
    const boldButton = screen.getByRole('button', { name: 'Bold' });

    expect(popoverTrigger).toHaveAttribute('aria-controls', popover.id);
    expect(document.activeElement).toBe(boldButton);

    await fireEvent.keyDown(window, { key: 'Escape' });
    await tick();

    expect(screen.queryByRole('dialog', { name: 'Formatting actions' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(popoverTrigger);
  });
});
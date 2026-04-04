import InlineEditVsFormDemo from '$lib/components/article-demos/InlineEditVsFormDemo.svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

describe('InlineEditVsFormDemo', () => {
  it('opens a dedicated form with multiple related fields', async () => {
    render(InlineEditVsFormDemo);

    await fireEvent.click(screen.getByRole('button', { name: 'Open full editor' }));

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Team')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save profile changes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel form edits' })).toBeInTheDocument();
  });
});
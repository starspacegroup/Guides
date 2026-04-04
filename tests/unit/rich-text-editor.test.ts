import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RichTextEditor from '../../src/lib/components/RichTextEditor.svelte';

describe('RichTextEditor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a visual editing surface with formatting controls', () => {
    render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body'
      }
    });

    expect(screen.getByRole('toolbar', { name: /body formatting toolbar/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /body visual editor/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /code block/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /insert image/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /insert table/i })).toBeTruthy();
    expect(screen.getByLabelText(/code block language/i)).toBeTruthy();
    expect(screen.getByRole('tab', { name: /preview/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /markdown/i })).toBeTruthy();
  });

  it('updates markdown source when the visual editor content changes', async () => {
    const { container } = render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body'
      }
    });

    const editor = screen.getByRole('textbox', { name: /body visual editor/i });
    editor.innerHTML = '<h2>Heading</h2><p>Paragraph</p><figure><img src="https://example.com/diagram.png" alt="Diagram"></figure><table><thead><tr><th>Feature</th><th>Status</th></tr></thead><tbody><tr><td>Images</td><td>Ready</td></tr></tbody></table><pre data-language="ts"><code class="language-ts">const enabled = true;</code></pre>';
    await fireEvent.input(editor);

    await fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));

    const source = container.querySelector('textarea.rich-text-editor__source') as HTMLTextAreaElement;
    expect(source.value).toContain('## Heading');
    expect(source.value).toContain('Paragraph');
    expect(source.value).toContain('![Diagram](https://example.com/diagram.png)');
    expect(source.value).toContain('| Feature | Status |');
    expect(source.value).toContain('```ts\nconst enabled = true;\n```');
  });

  it('renders code blocks in preview mode from markdown content', async () => {
    render(RichTextEditor, {
      props: {
        value: 'Use this:\n\n```ts\nconst enabled = true;\n```',
        label: 'Body'
      }
    });

    await fireEvent.click(screen.getByRole('tab', { name: /preview/i }));

    const codeBlock = document.querySelector('.rich-text-editor__preview pre code');
    expect(codeBlock?.textContent).toContain('const enabled = true;');
  });

  it('inserts image, table, and language-tagged code blocks from toolbar actions', async () => {
    const promptValues = ['https://example.com/photo.png', 'Cover image', 'System diagram'];
    vi.spyOn(window, 'prompt').mockImplementation(() => promptValues.shift() ?? null);

    const { container } = render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body'
      }
    });

    await fireEvent.change(screen.getByLabelText(/code block language/i), {
      target: { value: 'python' }
    });
    await fireEvent.click(screen.getByRole('button', { name: /insert image/i }));
    await fireEvent.click(screen.getByRole('button', { name: /insert table/i }));
    await fireEvent.click(screen.getByRole('button', { name: /code block/i }));
    await fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));

    const source = container.querySelector('textarea.rich-text-editor__source') as HTMLTextAreaElement;
    expect(source.value).toContain('![Cover image](https://example.com/photo.png "System diagram")');
    expect(source.value).toContain('| Column 1 | Column 2 |');
    expect(source.value).toContain('```python');
  });
});
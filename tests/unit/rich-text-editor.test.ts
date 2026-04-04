import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RichTextEditor from '../../src/lib/components/RichTextEditor.svelte';

function mockMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => true
  }));
}

describe('RichTextEditor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('matchMedia', mockMatchMedia(false));
  });

  it('renders a desktop workspace with formatting controls and guide panels visible', () => {
    vi.stubGlobal('matchMedia', mockMatchMedia(true));

    render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body',
        startExpanded: true
      }
    });

    expect(screen.getByRole('toolbar', { name: /body formatting toolbar/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /body visual editor/i })).toBeTruthy();
    expect(screen.getByRole('complementary', { name: /editor guide/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /code block/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /insert image/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /insert table/i })).toBeTruthy();
    expect(screen.getByLabelText(/code block language/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /exit full-page editor/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /preview/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /markdown/i })).toBeTruthy();
  });

  it('keeps secondary controls collapsed by default on mobile and reveals them on demand', async () => {
    vi.stubGlobal('matchMedia', mockMatchMedia(false));

    render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body',
        startExpanded: true
      }
    });

    expect(screen.queryByRole('toolbar', { name: /body formatting toolbar/i })).toBeNull();
    expect(screen.queryByRole('complementary', { name: /editor guide/i })).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: /show formatting tools/i }));
    expect(screen.getByRole('toolbar', { name: /body formatting toolbar/i })).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: /show writing guide/i }));
    expect(screen.getByRole('complementary', { name: /editor guide/i })).toBeTruthy();
  });

  it('exposes quick insert actions on mobile without opening the full toolset', async () => {
    vi.stubGlobal('matchMedia', mockMatchMedia(false));

    const promptValues = ['https://example.com/mobile-photo.png', 'Mobile image', ''];
    vi.spyOn(window, 'prompt').mockImplementation(() => promptValues.shift() ?? null);

    const { container } = render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body',
        startExpanded: true
      }
    });

    expect(screen.queryByRole('toolbar', { name: /body formatting toolbar/i })).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: /quick insert image/i }));
    await fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));

    const source = container.querySelector('textarea.rich-text-editor__source') as HTMLTextAreaElement;
    expect(source.value).toContain('![Mobile image](https://example.com/mobile-photo.png)');
  });

  it('updates markdown source when the visual editor content changes', async () => {
    const { container } = render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body',
        startExpanded: true
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
        label: 'Body',
        startExpanded: true
      }
    });

    await fireEvent.click(screen.getByRole('tab', { name: /preview/i }));

    const codeBlock = document.querySelector('.rich-text-editor__preview pre code');
    expect(codeBlock?.textContent).toContain('const enabled = true;');
  });

  it('inserts image, table, and language-tagged code blocks from toolbar actions', async () => {
    vi.stubGlobal('matchMedia', mockMatchMedia(true));

    const promptValues = ['https://example.com/photo.png', 'Cover image', 'System diagram'];
    vi.spyOn(window, 'prompt').mockImplementation(() => promptValues.shift() ?? null);

    const { container } = render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body',
        startExpanded: true
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

  it('does not bubble expand toggle clicks to parent containers', async () => {
    const parentClickSpy = vi.fn();
    const target = document.createElement('div');
    target.addEventListener('click', parentClickSpy);
    document.body.appendChild(target);

    render(RichTextEditor, {
      target,
      props: {
        value: '',
        label: 'Body',
        startExpanded: true
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /exit full-page editor/i }));

    expect(parentClickSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /open full-page editor/i })).toBeTruthy();
  });

  it('collapses expanded mode on escape without bubbling to parent handlers', async () => {
    const parentKeydownSpy = vi.fn();
    const target = document.createElement('div');
    target.addEventListener('keydown', parentKeydownSpy);
    document.body.appendChild(target);

    render(RichTextEditor, {
      target,
      props: {
        value: '',
        label: 'Body',
        startExpanded: true
      }
    });

    await fireEvent.keyDown(screen.getByRole('textbox', { name: /body visual editor/i }), {
      key: 'Escape'
    });

    expect(parentKeydownSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /open full-page editor/i })).toBeTruthy();
  });

  it('locks document scroll while expanded and restores it when collapsed', async () => {
    document.body.style.overflow = 'visible';
    document.documentElement.style.overflow = 'visible';

    render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body',
        startExpanded: true
      }
    });

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    await fireEvent.click(screen.getByRole('button', { name: /exit full-page editor/i }));

    expect(document.body.style.overflow).toBe('visible');
    expect(document.documentElement.style.overflow).toBe('visible');
  });
});
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
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
    vi.stubGlobal('fetch', vi.fn());
    document.execCommand = vi.fn(() => true);
  });

  it('renders a desktop workspace with formatting controls and guide panels visible', () => {
    vi.stubGlobal('matchMedia', mockMatchMedia(true));

    render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body'
      }
    });

    expect(screen.getByRole('toolbar', { name: /body formatting toolbar/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /body visual editor/i })).toBeTruthy();
    expect(screen.getByRole('complementary', { name: /editor guide/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /code block/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /insert image/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /insert table/i })).toBeTruthy();
    expect(screen.getByLabelText(/code block language/i)).toBeTruthy();
    expect(screen.getByRole('tab', { name: /preview/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /markdown/i })).toBeTruthy();
  });

  it('keeps secondary controls collapsed by default on mobile and reveals them on demand', async () => {
    vi.stubGlobal('matchMedia', mockMatchMedia(false));

    render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body'
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

    const { container } = render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body'
      }
    });

    expect(screen.queryByRole('toolbar', { name: /body formatting toolbar/i })).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: /quick insert image/i }));
    await waitFor(() => {
      expect(container.querySelector('[aria-label="Use image URL"]')).toBeTruthy();
    });
    await fireEvent.click(container.querySelector('[aria-label="Use image URL"]') as HTMLButtonElement);
    await fireEvent.input(container.querySelector('[aria-label="Image URL"]') as HTMLInputElement, {
      target: { value: 'https://example.com/mobile-photo.png' }
    });
    await fireEvent.input(container.querySelector('[aria-label="Image alt text"]') as HTMLInputElement, {
      target: { value: 'Mobile image' }
    });
    await fireEvent.click(screen.getByRole('button', { name: /insert image from url/i }));
    await waitFor(() => {
      expect(container.querySelector('.rich-text-editor__media-studio')).toBeNull();
    });
    await fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));

    const source = container.querySelector('textarea.rich-text-editor__source') as HTMLTextAreaElement;
    await waitFor(() => {
      expect(source.value).toContain('![Mobile image](https://example.com/mobile-photo.png)');
    });
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
    expect(document.querySelector('.rich-text-editor__preview.cms-content')).toBeTruthy();
  });

  it('inserts an uploaded image with alt text and caption metadata', async () => {
    vi.stubGlobal('matchMedia', mockMatchMedia(true));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        url: 'https://cdn.example.com/uploads/photo.png',
        storage: 'inline'
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body'
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /insert image/i }));

    await waitFor(() => {
      expect(container.querySelector('[aria-label="Upload image file"]')).toBeTruthy();
    });
    const fileInput = container.querySelector('[aria-label="Upload image file"]') as HTMLInputElement;
    const file = new File(['image-bytes'], 'photo.png', { type: 'image/png' });

    await fireEvent.change(fileInput, {
      target: {
        files: [file]
      }
    });

    await fireEvent.input(container.querySelector('[aria-label="Image alt text"]') as HTMLInputElement, {
      target: { value: 'Cover image' }
    });
    await fireEvent.input(container.querySelector('[aria-label="Image caption"]') as HTMLInputElement, {
      target: { value: 'System diagram' }
    });

    await fireEvent.click(screen.getByRole('button', { name: /insert uploaded image/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(container.querySelector('.rich-text-editor__media-studio')).toBeNull();
    });
    await fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));

    const source = container.querySelector('textarea.rich-text-editor__source') as HTMLTextAreaElement;
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/cms/uploads',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData)
      })
    );
    await waitFor(() => {
      expect(source.value).toContain(
        '![Cover image](https://cdn.example.com/uploads/photo.png "System diagram")'
      );
    });
  });

  it('inserts image, table, and language-tagged code blocks from toolbar actions', async () => {
    vi.stubGlobal('matchMedia', mockMatchMedia(true));

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
    await waitFor(() => {
      expect(container.querySelector('[aria-label="Use image URL"]')).toBeTruthy();
    });
    await fireEvent.click(container.querySelector('[aria-label="Use image URL"]') as HTMLButtonElement);
    await fireEvent.input(container.querySelector('[aria-label="Image URL"]') as HTMLInputElement, {
      target: { value: 'https://example.com/photo.png' }
    });
    await fireEvent.input(container.querySelector('[aria-label="Image alt text"]') as HTMLInputElement, {
      target: { value: 'Cover image' }
    });
    await fireEvent.input(container.querySelector('[aria-label="Image caption"]') as HTMLInputElement, {
      target: { value: 'System diagram' }
    });
    await fireEvent.click(screen.getByRole('button', { name: /insert image from url/i }));
    await waitFor(() => {
      expect(container.querySelector('.rich-text-editor__media-studio')).toBeNull();
    });
    await fireEvent.click(screen.getByRole('button', { name: /insert table/i }));
    await fireEvent.click(screen.getByRole('button', { name: /code block/i }));
    await fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));

    const source = container.querySelector('textarea.rich-text-editor__source') as HTMLTextAreaElement;
    await waitFor(() => {
      expect(source.value).toContain('![Cover image](https://example.com/photo.png "System diagram")');
      expect(source.value).toContain('| Column 1 | Column 2 |');
      expect(source.value).toContain('```python');
    });
  });

  it('shows an inline media error when uploads fail', async () => {
    vi.stubGlobal('matchMedia', mockMatchMedia(true));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Upload failed hard' })
    }));

    render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body'
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /insert image/i }));

    await waitFor(() => {
      expect(document.querySelector('[aria-label="Upload image file"]')).toBeTruthy();
    });
    const fileInput = document.querySelector('[aria-label="Upload image file"]') as HTMLInputElement;
    await fireEvent.change(fileInput, {
      target: {
        files: [new File(['image-bytes'], 'photo.png', { type: 'image/png' })]
      }
    });
    await fireEvent.click(screen.getByRole('button', { name: /insert uploaded image/i }));

    await waitFor(() => {
      expect(screen.getByText(/upload failed hard/i)).toBeTruthy();
    });
  });

  it('handles keyboard formatting shortcuts in the fullscreen workspace', async () => {
    render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body'
      }
    });

    await fireEvent.keyDown(screen.getByRole('textbox', { name: /body visual editor/i }), {
      key: 'b',
      ctrlKey: true
    });

    expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
  });

  it('locks document scroll for the fullscreen workspace and restores it on teardown', async () => {
    document.body.style.overflow = 'visible';
    document.documentElement.style.overflow = 'visible';

    const view = render(RichTextEditor, {
      props: {
        value: '',
        label: 'Body'
      }
    });

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    view.component.$destroy();

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('visible');
      expect(document.documentElement.style.overflow).toBe('visible');
    });
  });
});
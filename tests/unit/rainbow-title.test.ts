import { describe, expect, it } from 'vitest';
import { enhanceRainbowTitle, rainbowTitleRegion } from '../../src/lib/utils/rainbow-title';

describe('rainbow title enhancer', () => {
  it('turns plain title text into selectable rainbow characters', () => {
    const title = document.createElement('h1');
    title.setAttribute('data-rainbow-title', 'true');
    title.textContent = 'Launch Ready';
    document.body.appendChild(title);

    const cleanup = enhanceRainbowTitle(title);
    const chars = Array.from(title.querySelectorAll<HTMLElement>('.rainbow-title__char'));

    expect(title.classList.contains('rainbow-title')).toBe(true);
    expect(title.style.userSelect).toBe('none');
    expect(title.getAttribute('aria-label')).toBe('Launch Ready');
    expect(title.textContent).toBe('Launch Ready');

    chars[2].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    chars[7].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    expect(chars[2].classList.contains('is-selected')).toBe(true);
    expect(chars[7].classList.contains('is-selected')).toBe(true);
    expect(chars[8].classList.contains('is-selected')).toBe(false);

    cleanup();
    expect(title.textContent).toBe('Launch Ready');
  });

  it('keeps characters grouped by word so wrapping only happens between words', () => {
    const title = document.createElement('h1');
    title.setAttribute('data-rainbow-title', 'true');
    title.textContent = 'Software guides for launch-ready apps';
    document.body.appendChild(title);

    const cleanup = enhanceRainbowTitle(title);
    const words = Array.from(title.querySelectorAll<HTMLElement>('.rainbow-title__word'));

    expect(words.map((word) => word.textContent).join(' ')).toBe(
      'Software guides for launch-ready apps'
    );
    expect(words.every((word) => word.style.whiteSpace === 'nowrap')).toBe(true);
    expect(title.textContent).toBe('Software guides for launch-ready apps');

    cleanup();
  });

  it('enhances matching titles across a region and picks up new headings', async () => {
    const container = document.createElement('main');
    container.innerHTML = `
			<section>
        <h1>Primary Title</h1>
        <h1 data-rainbow-title="true">Home Hero Title</h1>
				<h2 class="panel-title">Panel Overview</h2>
				<h2 data-rainbow-title="true">Hero Secondary</h2>
				<h2><span>Nested Markup</span></h2>
			</section>
		`;
    document.body.appendChild(container);

    const action = rainbowTitleRegion(container);
    const nestedTitle = Array.from(container.querySelectorAll('h2')).find(
      (element) => !element.classList.contains('panel-title') && !element.hasAttribute('data-rainbow-title')
    );

    expect(container.querySelector('h1')?.classList.contains('rainbow-title')).toBe(false);
    expect(container.querySelector('[data-rainbow-title="true"]')?.classList.contains('rainbow-title')).toBe(true);
    expect(container.querySelector('.panel-title')?.classList.contains('rainbow-title')).toBe(false);
    expect(
      container.querySelectorAll('[data-rainbow-title]')[1]?.classList.contains('rainbow-title')
    ).toBe(true);
    expect(nestedTitle?.classList.contains('rainbow-title')).toBe(false);

    const nextTitle = document.createElement('h1');
    nextTitle.setAttribute('data-rainbow-title', 'true');
    nextTitle.textContent = 'Fresh Route Title';
    container.appendChild(nextTitle);

    await Promise.resolve();

    expect(nextTitle.classList.contains('rainbow-title')).toBe(true);

    action.destroy();
  });

});
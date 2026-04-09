const TITLE_SELECTOR = '[data-rainbow-title]';
const MANAGED_SELECTOR = `${TITLE_SELECTOR}, [data-rainbow-title-enhanced="true"]`;
const RAINBOW_COLORS = [
  'var(--color-title-rainbow-1)',
  'var(--color-title-rainbow-2)',
  'var(--color-title-rainbow-3)',
  'var(--color-title-rainbow-4)',
  'var(--color-title-rainbow-5)',
  'var(--color-title-rainbow-6)'
] as const;
const RAINBOW_LIFTS = ['0em', '-0.08em', '-0.02em', '-0.1em', '-0.04em', '-0.07em'] as const;

function splitText(value: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(value), (segment) => segment.segment);
  }

  return Array.from(value);
}

function tokenizeText(value: string): Array<{ type: 'word' | 'space'; value: string; }> {
  return value.match(/\S+|\s+/g)?.map((token) => ({
    type: /\s+/.test(token) ? 'space' : 'word',
    value: token
  })) ?? [];
}

function getManagedTitles(root: ParentNode): HTMLElement[] {
  const titles: HTMLElement[] = [];

  if (root instanceof HTMLElement && root.matches(MANAGED_SELECTOR)) {
    titles.push(root);
  }

  titles.push(...Array.from(root.querySelectorAll<HTMLElement>(MANAGED_SELECTOR)));
  return titles;
}

function isEligibleTitle(node: HTMLElement): boolean {
  if (node.dataset.rainbowTitleEnhanced === 'true') {
    return true;
  }

  if (!node.matches(TITLE_SELECTOR)) {
    return false;
  }

  if (node.childElementCount > 0) {
    return false;
  }

  return Boolean(node.textContent?.trim());
}

export function enhanceRainbowTitle(node: HTMLElement): () => void {
  if (!isEligibleTitle(node) || node.dataset.rainbowTitleEnhanced === 'true') {
    return () => { };
  }

  const originalText = node.textContent ?? '';
  const accessibleLabel = originalText.replace(/\s+/g, ' ').trim();
  const characters = splitText(originalText);

  if (!accessibleLabel || characters.length === 0) {
    return () => { };
  }

  const originalUserSelect = node.style.userSelect;
  const originalAriaLabel = node.getAttribute('aria-label');
  const originalTabIndex = node.getAttribute('tabindex');
  const hadAriaLabel = node.hasAttribute('aria-label');
  const hadTabIndex = node.hasAttribute('tabindex');

  node.dataset.rainbowTitleEnhanced = 'true';
  node.classList.add('rainbow-title');
  node.style.userSelect = 'none';
  node.setAttribute('aria-label', accessibleLabel);

  if (!hadTabIndex) {
    node.setAttribute('tabindex', '0');
  }

  const fragment = document.createDocumentFragment();
  const spans: HTMLSpanElement[] = [];
  let charIndex = 0;

  for (const token of tokenizeText(originalText)) {
    if (token.type === 'space') {
      fragment.appendChild(document.createTextNode(token.value));
      continue;
    }

    const word = document.createElement('span');
    word.className = 'rainbow-title__word';
    word.setAttribute('aria-hidden', 'true');
    word.style.whiteSpace = 'nowrap';

    for (const character of splitText(token.value)) {
      const span = document.createElement('span');
      span.className = 'rainbow-title__char';
      span.dataset.rainbowCharIndex = String(charIndex);
      span.setAttribute('aria-hidden', 'true');
      span.style.setProperty('--rainbow-char-color', RAINBOW_COLORS[charIndex % RAINBOW_COLORS.length]);
      span.style.setProperty('--rainbow-char-lift', RAINBOW_LIFTS[charIndex % RAINBOW_LIFTS.length]);
      span.textContent = character;
      word.appendChild(span);
      spans.push(span);
      charIndex += 1;
    }

    fragment.appendChild(word);
  }

  node.textContent = '';
  node.appendChild(fragment);

  let anchorIndex: number | null = null;
  let isDragging = false;

  const clearSelection = () => {
    node.classList.remove('rainbow-title--selected');
    for (const span of spans) {
      span.classList.remove('is-selected');
      span.style.removeProperty('--rainbow-char-order');
    }
  };

  const paintSelection = (start: number, end: number) => {
    const lowerBound = Math.min(start, end);
    const upperBound = Math.max(start, end);

    node.classList.add('rainbow-title--selected');

    for (const span of spans) {
      const index = Number(span.dataset.rainbowCharIndex);
      const selected = index >= lowerBound && index <= upperBound;
      span.classList.toggle('is-selected', selected);

      if (selected) {
        span.style.setProperty('--rainbow-char-order', String(index - lowerBound));
      } else {
        span.style.removeProperty('--rainbow-char-order');
      }
    }
  };

  const getCharIndex = (target: EventTarget | null): number | null => {
    if (!(target instanceof Element)) {
      return null;
    }

    const span = target.closest<HTMLElement>('.rainbow-title__char');
    if (!span || !node.contains(span)) {
      return null;
    }

    return Number(span.dataset.rainbowCharIndex);
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }

    const index = getCharIndex(event.target);
    if (index === null) {
      return;
    }

    event.preventDefault();
    anchorIndex = index;
    isDragging = true;
    paintSelection(index, index);
  };

  const handleCharEnter = (event: MouseEvent) => {
    if (!isDragging || anchorIndex === null) {
      return;
    }

    const index = getCharIndex(event.currentTarget);
    if (index === null) {
      return;
    }

    paintSelection(anchorIndex, index);
  };

  const handleDocumentMouseUp = () => {
    isDragging = false;
    anchorIndex = null;
  };

  const handleDocumentMouseDown = (event: MouseEvent) => {
    if (node.contains(event.target as Node)) {
      return;
    }

    clearSelection();
    isDragging = false;
    anchorIndex = null;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      paintSelection(0, spans.length - 1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      clearSelection();
    }
  };

  node.addEventListener('mousedown', handleMouseDown);
  node.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mouseup', handleDocumentMouseUp);
  document.addEventListener('mousedown', handleDocumentMouseDown);

  for (const span of spans) {
    span.addEventListener('mouseenter', handleCharEnter);
  }

  return () => {
    node.removeEventListener('mousedown', handleMouseDown);
    node.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mouseup', handleDocumentMouseUp);
    document.removeEventListener('mousedown', handleDocumentMouseDown);

    for (const span of spans) {
      span.removeEventListener('mouseenter', handleCharEnter);
    }

    node.classList.remove('rainbow-title', 'rainbow-title--selected');
    node.style.userSelect = originalUserSelect;
    node.textContent = originalText;
    delete node.dataset.rainbowTitleEnhanced;

    if (hadAriaLabel) {
      node.setAttribute('aria-label', originalAriaLabel ?? '');
    } else {
      node.removeAttribute('aria-label');
    }

    if (hadTabIndex) {
      node.setAttribute('tabindex', originalTabIndex ?? '0');
    } else {
      node.removeAttribute('tabindex');
    }
  };
}

export function rainbowTitleRegion(node: HTMLElement) {
  const cleanups = new Map<HTMLElement, () => void>();

  const syncTitles = () => {
    const titles = getManagedTitles(node).filter((title) => node.contains(title) && isEligibleTitle(title));
    const liveTitles = new Set<HTMLElement>();

    for (const title of titles) {
      liveTitles.add(title);

      if (!cleanups.has(title) && title.dataset.rainbowTitleEnhanced !== 'true') {
        cleanups.set(title, enhanceRainbowTitle(title));
      }
    }

    for (const [title, cleanup] of cleanups) {
      if (liveTitles.has(title) && node.contains(title)) {
        continue;
      }

      cleanup();
      cleanups.delete(title);
    }
  };

  syncTitles();

  const observer = new MutationObserver(() => {
    syncTitles();
  });

  observer.observe(node, {
    childList: true,
    subtree: true
  });

  return {
    destroy() {
      observer.disconnect();

      for (const cleanup of cleanups.values()) {
        cleanup();
      }

      cleanups.clear();
    }
  };
}
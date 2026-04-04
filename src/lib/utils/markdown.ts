function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sanitizeHref(href: string): string | null {
  const trimmedHref = href.trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|#|\.\.?\/)/i.test(trimmedHref)) {
    return trimmedHref;
  }

  return null;
}

function renderInline(markdown: string): string {
  const codeSegments: string[] = [];
  let html = escapeHtml(markdown);

  html = html.replace(/`([^`]+)`/g, (_, code: string) => {
    const placeholder = `@@CODESEGMENT${codeSegments.length}@@`;
    codeSegments.push(`<code>${escapeHtml(code)}</code>`);
    return placeholder;
  });

  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, href: string) => {
    const safeHref = sanitizeHref(href);
    if (!safeHref) {
      return match;
    }

    return `<a href="${escapeHtml(safeHref)}">${renderInline(label)}</a>`;
  });

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  html = html.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>');

  return codeSegments.reduce(
    (output, segment, index) => output.replace(`@@CODESEGMENT${index}@@`, segment),
    html
  );
}

function renderList(lines: string[], ordered: boolean): string {
  const tagName = ordered ? 'ol' : 'ul';
  const itemPattern = ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;
  const items = lines
    .map((line) => line.match(itemPattern)?.[1] ?? '')
    .map((line) => `<li>${renderInline(line.trim())}</li>`)
    .join('');

  return `<${tagName}>${items}</${tagName}>`;
}

function isSpecialBlockStart(line: string): boolean {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^\s*[-*_](\s*[-*_]){2,}\s*$/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    /^\s*>\s?/.test(line) ||
    /^```/.test(line)
  );
}

export function renderMarkdownToHtml(markdown: string | null | undefined): string {
  if (!markdown?.trim()) {
    return '';
  }

  const normalized = markdown.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    if (/^```/.test(trimmedLine)) {
      index += 1;
      const codeLines: string[] = [];
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${renderInline(headingMatch[2].trim())}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*[-*_](\s*[-*_]){2,}\s*$/.test(trimmedLine)) {
      blocks.push('<hr>');
      index += 1;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const listLines: string[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        listLines.push(lines[index]);
        index += 1;
      }
      blocks.push(renderList(listLines, false));
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const listLines: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        listLines.push(lines[index]);
        index += 1;
      }
      blocks.push(renderList(listLines, true));
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      blocks.push(`<blockquote>${renderMarkdownToHtml(quoteLines.join('\n'))}</blockquote>`);
      continue;
    }

    const paragraphLines = [trimmedLine];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isSpecialBlockStart(lines[index].trim())) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push(`<p>${renderInline(paragraphLines.join(' '))}</p>`);
  }

  return blocks.join('');
}
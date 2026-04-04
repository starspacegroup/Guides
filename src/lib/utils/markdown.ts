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

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('`', '&#96;');
}

function parseImageSyntax(markdown: string): { alt: string; src: string; title: string | null; } | null {
  const match = markdown.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
  if (!match) {
    return null;
  }

  const safeSrc = sanitizeHref(match[2]);
  if (!safeSrc) {
    return null;
  }

  return {
    alt: match[1],
    src: safeSrc,
    title: match[3] ?? null
  };
}

function isTableDelimiter(line: string): boolean {
  const trimmed = line.trim();
  return /^\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?$/.test(trimmed);
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

function renderTable(lines: string[]): string {
  const [headerLine, , ...bodyLines] = lines;
  const headers = splitTableRow(headerLine)
    .map((cell) => `<th>${renderInline(cell)}</th>`)
    .join('');
  const rows = bodyLines
    .filter((line) => line.trim())
    .map((line) => {
      const cells = splitTableRow(line)
        .map((cell) => `<td>${renderInline(cell)}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

function renderInline(markdown: string): string {
  const codeSegments: string[] = [];
  const imageSegments: string[] = [];
  let html = escapeHtml(markdown);

  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (match) => {
    const image = parseImageSyntax(match);
    if (!image) {
      return match;
    }

    const placeholder = `@@IMAGESEGMENT${imageSegments.length}@@`;
    const titleAttribute = image.title ? ` title="${escapeAttribute(image.title)}"` : '';
    imageSegments.push(
      `<figure><img src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.alt)}"${titleAttribute}></figure>`
    );
    return placeholder;
  });

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

  html = imageSegments.reduce(
    (output, segment, index) => output.replace(`@@IMAGESEGMENT${index}@@`, segment),
    html
  );

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
    /^!\[[^\]]*\]\([^)]+\)$/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    /^\s*>\s?/.test(line) ||
    /^```/.test(line) ||
    /^\|.+\|$/.test(line)
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

    const fenceMatch = trimmedLine.match(/^```([a-z0-9_-]+)?$/i);
    if (fenceMatch) {
      index += 1;
      const codeLines: string[] = [];
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      const language = fenceMatch[1]?.trim();
      const languageAttribute = language ? ` data-language="${escapeAttribute(language)}"` : '';
      const codeClass = language ? ` class="language-${escapeAttribute(language)}"` : '';
      blocks.push(`<pre${languageAttribute}><code${codeClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    const image = parseImageSyntax(trimmedLine);
    if (image) {
      const titleAttribute = image.title ? ` title="${escapeAttribute(image.title)}"` : '';
      blocks.push(
        `<figure><img src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.alt)}"${titleAttribute}></figure>`
      );
      index += 1;
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

    if (/^\|.+\|$/.test(trimmedLine) && index + 1 < lines.length && isTableDelimiter(lines[index + 1])) {
      const tableLines = [trimmedLine, lines[index + 1].trim()];
      index += 2;
      while (index < lines.length && /^\|.+\|$/.test(lines[index].trim())) {
        tableLines.push(lines[index].trim());
        index += 1;
      }
      blocks.push(renderTable(tableLines));
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
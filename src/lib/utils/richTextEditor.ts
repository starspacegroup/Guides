function normalizeWhitespace(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeInlineCode(value: string): string {
  return value.replace(/`/g, '\\`');
}

function joinBlocks(blocks: string[]): string {
  return blocks
    .map((block) => block.trim())
    .filter(Boolean)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const content = Array.from(element.childNodes).map(serializeInline).join('');

  switch (element.tagName.toLowerCase()) {
    case 'strong':
    case 'b':
      return content ? `**${content}**` : '';
    case 'em':
    case 'i':
      return content ? `*${content}*` : '';
    case 'code':
      return content ? `\`${escapeInlineCode(content)}\`` : '';
    case 'a': {
      const href = element.getAttribute('href');
      return href && content ? `[${content}](${href})` : content;
    }
    case 'img': {
      const src = element.getAttribute('src');
      if (!src) {
        return '';
      }

      const alt = element.getAttribute('alt') ?? '';
      const title = element.getAttribute('title');
      return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
    }
    case 'br':
      return '\n';
    default:
      return content;
  }
}

function escapeTableCell(cell: string): string {
  return cell.replace(/\|/g, '\\|');
}

function serializeTable(table: HTMLElement): string[] {
  const rows = Array.from(table.querySelectorAll('tr')).map((row) =>
    Array.from(row.children)
      .filter((cell): cell is HTMLElement => cell instanceof HTMLElement)
      .map((cell) => escapeTableCell(serializeInlineChildren(Array.from(cell.childNodes))))
  );

  if (rows.length === 0 || rows[0].length === 0) {
    return [];
  }

  const header = `| ${rows[0].join(' | ')} |`;
  const divider = `| ${rows[0].map(() => '---').join(' | ')} |`;
  const body = rows.slice(1).map((row) => `| ${row.join(' | ')} |`);

  return [header, divider, ...body];
}

function detectCodeLanguage(element: HTMLElement): string {
  const codeElement = element.querySelector('code');
  const explicitLanguage = element.getAttribute('data-language') || codeElement?.getAttribute('data-language');
  if (explicitLanguage) {
    return explicitLanguage.trim();
  }

  const className = codeElement?.className ?? '';
  const languageMatch = className.match(/language-([a-z0-9_-]+)/i);
  return languageMatch?.[1] ?? '';
}

function serializeInlineChildren(nodes: Node[]): string {
  return nodes
    .map(serializeInline)
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function serializeList(list: HTMLElement, ordered: boolean, depth = 0): string[] {
  return Array.from(list.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement && child.tagName.toLowerCase() === 'li')
    .flatMap((item, index) => serializeListItem(item, ordered, depth, index));
}

function serializeListItem(item: HTMLElement, ordered: boolean, depth: number, index: number): string[] {
  const nestedLists = Array.from(item.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && ['ul', 'ol'].includes(child.tagName.toLowerCase())
  );
  const inlineNodes = Array.from(item.childNodes).filter(
    (node) => !(node instanceof HTMLElement && ['ul', 'ol'].includes(node.tagName.toLowerCase()))
  );
  const marker = ordered ? `${index + 1}. ` : '- ';
  const indent = '  '.repeat(depth);
  const text = serializeInlineChildren(inlineNodes) || '';
  const lines = [`${indent}${marker}${text}`.trimEnd()];

  for (const nestedList of nestedLists) {
    const nestedOrdered = nestedList.tagName.toLowerCase() === 'ol';
    lines.push(...serializeList(nestedList, nestedOrdered, depth + 1));
  }

  return lines;
}

function serializeBlock(node: Node): string[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = normalizeWhitespace(node.textContent ?? '');
    return text ? [text] : [];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();

  switch (tagName) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const level = Number.parseInt(tagName.slice(1), 10);
      const text = serializeInlineChildren(Array.from(element.childNodes));
      return text ? [`${'#'.repeat(level)} ${text}`] : [];
    }
    case 'p':
    case 'div': {
      const hasBlockChildren = Array.from(element.children).some((child) =>
        ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'pre'].includes(
          child.tagName.toLowerCase()
        )
      );
      if (hasBlockChildren) {
        return Array.from(element.childNodes).flatMap(serializeBlock);
      }
      const text = serializeInlineChildren(Array.from(element.childNodes));
      return text ? [text] : [];
    }
    case 'blockquote': {
      const content = joinBlocks(Array.from(element.childNodes).flatMap(serializeBlock));
      return content
        ? [content.split('\n').map((line) => `> ${line}`).join('\n')]
        : [];
    }
    case 'figure': {
      const image = element.querySelector('img');
      if (!image) {
        return Array.from(element.childNodes).flatMap(serializeBlock);
      }

      const src = image.getAttribute('src');
      if (!src) {
        return [];
      }

      const alt = image.getAttribute('alt') ?? '';
      const title = image.getAttribute('title');
      return [title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`];
    }
    case 'table':
      return serializeTable(element);
    case 'ul':
      return serializeList(element, false);
    case 'ol':
      return serializeList(element, true);
    case 'pre': {
      const code = (element.textContent ?? '').replace(/\r\n?/g, '\n').replace(/\n+$/g, '');
      const language = detectCodeLanguage(element);
      const fence = language ? `\`\`\`${language}` : '\`\`\`';
      return code ? [`${fence}\n${code}\n\`\`\``] : [];
    }
    case 'hr':
      return ['---'];
    case 'br':
      return [];
    default: {
      const text = serializeInlineChildren(Array.from(element.childNodes));
      return text ? [text] : [];
    }
  }
}

export function editorHtmlToMarkdown(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) {
    return '';
  }

  if (typeof document === 'undefined') {
    return normalizeWhitespace(trimmed.replace(/<[^>]+>/g, ' '));
  }

  const template = document.createElement('template');
  template.innerHTML = trimmed;

  return joinBlocks(Array.from(template.content.childNodes).flatMap(serializeBlock));
}
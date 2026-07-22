import type { CodeSample } from './content-types';
import { fenceFor, normalizeLanguage } from './code-fence';

/**
 * Minimal structural model of a Storyblok richtext (ProseMirror) node. The
 * serializer only reads these fields; unknown node types are skipped, never
 * thrown (RT#5), so schema drift can never 500 the `.md` route.
 */
export interface RichtextMark {
  type: string;
  attrs?: Record<string, unknown> | null;
}

export interface RichtextNode {
  type: string;
  attrs?: Record<string, unknown> | null;
  content?: RichtextNode[] | null;
  text?: string;
  marks?: RichtextMark[] | null;
}

const str = (value: unknown): string => (typeof value === 'string' ? value : '');

// ---------------------------------------------------------------------------
// Code blocks (shared by markdown + plaintext + code-sample extraction)
// ---------------------------------------------------------------------------

/** A richtext `code_block` stores its language in `attrs.class="language-x"`. */
function codeBlockLanguage(node: RichtextNode): string {
  const fromClass = /language-(\S+)/.exec(str(node.attrs?.class))?.[1] ?? '';
  return normalizeLanguage(fromClass || str(node.attrs?.language));
}

function codeBlockText(node: RichtextNode): string {
  return (node.content ?? []).map((child) => child.text ?? '').join('');
}

// ---------------------------------------------------------------------------
// Inline marks + inline nodes → markdown
// ---------------------------------------------------------------------------

function applyMarks(text: string, marks: RichtextMark[] | null | undefined): string {
  if (!marks || marks.length === 0) return text;
  return marks.reduce((acc, mark) => {
    switch (mark.type) {
      case 'bold':
        return `**${acc}**`;
      case 'italic':
        return `*${acc}*`;
      case 'strike':
        return `~~${acc}~~`;
      case 'code':
        return `\`${acc}\``;
      case 'link':
        return `[${acc}](${str(mark.attrs?.href)})`;
      default:
        return acc;
    }
  }, text);
}

function serializeInlineNode(node: RichtextNode): string {
  switch (node.type) {
    case 'text':
      return applyMarks(node.text ?? '', node.marks);
    case 'hard_break':
      return '\n';
    case 'image': {
      const src = str(node.attrs?.src);
      return src ? `![${str(node.attrs?.alt)}](${src})` : '';
    }
    default:
      return '';
  }
}

const serializeInline = (nodes: RichtextNode[]): string =>
  nodes.map(serializeInlineNode).join('');

// ---------------------------------------------------------------------------
// Block nodes → markdown
// ---------------------------------------------------------------------------

function serializeList(node: RichtextNode, ordered: boolean, indent: number): string {
  const items = (node.content ?? []).filter((n) => n.type === 'list_item');
  const pad = '  '.repeat(indent);
  const lines: string[] = [];

  items.forEach((item, index) => {
    const marker = ordered ? `${index + 1}.` : '-';
    const children = item.content ?? [];
    let placed = false;

    for (const child of children) {
      if (child.type === 'bullet_list' || child.type === 'ordered_list') {
        lines.push(serializeList(child, child.type === 'ordered_list', indent + 1));
        // Count the nested list as placed content so an item that is *only* a
        // sub-list doesn't get an orphan empty marker appended after it.
        placed = true;
        continue;
      }
      const text =
        child.type === 'paragraph' ? serializeInline(child.content ?? []) : serializeBlock(child);
      lines.push(placed ? `${pad}  ${text}` : `${pad}${marker} ${text}`);
      placed = true;
    }

    if (!placed) lines.push(`${pad}${marker} `);
  });

  return lines.join('\n');
}

function serializeCodeBlock(node: RichtextNode): string {
  const code = codeBlockText(node);
  const lang = codeBlockLanguage(node);
  const fence = fenceFor(code);
  return `${fence}${lang}\n${code}\n${fence}`;
}

function serializeBlockquote(node: RichtextNode): string {
  const inner = serializeBlocks(node.content ?? []);
  return inner
    .split('\n')
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n');
}

function serializeTable(node: RichtextNode): string {
  const rows = (node.content ?? []).filter((n) => n.type === 'tableRow');
  if (rows.length === 0) return '';

  const cellText = (cell: RichtextNode): string =>
    serializeBlocks(cell.content ?? [])
      .replace(/\s*\n+\s*/g, ' ')
      .trim();
  const renderRow = (row: RichtextNode): string =>
    `| ${(row.content ?? []).map(cellText).join(' | ')} |`;

  const [header, ...rest] = rows;
  const columnCount = (header.content ?? []).length;
  const divider = `| ${Array.from({ length: columnCount }, () => '---').join(' | ')} |`;
  return [renderRow(header), divider, ...rest.map(renderRow)].join('\n');
}

function serializeBlock(node: RichtextNode): string {
  switch (node.type) {
    case 'doc':
      return serializeBlocks(node.content ?? []);
    case 'paragraph':
      return serializeInline(node.content ?? []);
    case 'heading': {
      const level = Math.min(Math.max(Number(node.attrs?.level) || 1, 1), 6);
      return `${'#'.repeat(level)} ${serializeInline(node.content ?? [])}`;
    }
    case 'bullet_list':
      return serializeList(node, false, 0);
    case 'ordered_list':
      return serializeList(node, true, 0);
    case 'blockquote':
      return serializeBlockquote(node);
    case 'code_block':
      return serializeCodeBlock(node);
    case 'horizontal_rule':
      return '---';
    case 'image': {
      const src = str(node.attrs?.src);
      return src ? `![${str(node.attrs?.alt)}](${src})` : '';
    }
    case 'table':
      return serializeTable(node);
    default:
      return '';
  }
}

const serializeBlocks = (nodes: RichtextNode[]): string =>
  nodes.map(serializeBlock).filter((s) => s.length > 0).join('\n\n');

/** Serialize a Storyblok richtext document to markdown. */
export function richtextToMarkdown(node: RichtextNode | null | undefined): string {
  if (!node) return '';
  return node.type === 'doc' ? serializeBlocks(node.content ?? []) : serializeBlock(node);
}

// ---------------------------------------------------------------------------
// Plaintext (for schema.org articleBody — code excluded, RT#13)
// ---------------------------------------------------------------------------

function inlinePlain(nodes: RichtextNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return n.text ?? '';
      if (n.type === 'hard_break') return '\n';
      return '';
    })
    .join('');
}

function blockPlain(node: RichtextNode): string {
  switch (node.type) {
    case 'doc':
      return blocksPlain(node.content ?? []);
    case 'paragraph':
    case 'heading':
      return inlinePlain(node.content ?? []);
    case 'blockquote':
      return blocksPlain(node.content ?? []);
    case 'bullet_list':
    case 'ordered_list':
      return (node.content ?? [])
        .filter((n) => n.type === 'list_item')
        .map((li) => blocksPlain(li.content ?? []))
        .filter(Boolean)
        .join('\n');
    case 'table':
      return (node.content ?? [])
        .filter((n) => n.type === 'tableRow')
        .map((row) =>
          (row.content ?? []).map((cell) => blocksPlain(cell.content ?? []).trim()).join(' '),
        )
        .join('\n');
    default:
      // code_block, image, horizontal_rule and unknowns contribute no prose.
      return '';
  }
}

const blocksPlain = (nodes: RichtextNode[]): string =>
  nodes.map(blockPlain).filter((s) => s.length > 0).join('\n\n');

/** Extract prose plaintext from a richtext document (code blocks excluded). */
export function richtextToPlainText(node: RichtextNode | null | undefined): string {
  if (!node) return '';
  return node.type === 'doc' ? blocksPlain(node.content ?? []) : blockPlain(node);
}

/** Collect every `code_block` in a richtext document as an ordered code sample. */
export function collectRichtextCodeSamples(node: RichtextNode | null | undefined): CodeSample[] {
  if (!node) return [];
  const out: CodeSample[] = [];
  const walk = (n: RichtextNode): void => {
    if (n.type === 'code_block') {
      out.push({ name: '', language: codeBlockLanguage(n), code: codeBlockText(n) });
      return;
    }
    (n.content ?? []).forEach(walk);
  };
  walk(node);
  return out;
}

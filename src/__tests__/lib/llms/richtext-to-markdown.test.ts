import { describe, it, expect } from 'vitest';
import {
  collectRichtextCodeSamples,
  richtextToMarkdown,
  richtextToPlainText,
  type RichtextNode,
} from '@/lib/llms/richtext-to-markdown';

const doc = (...content: RichtextNode[]): RichtextNode => ({ type: 'doc', content });
const p = (...content: RichtextNode[]): RichtextNode => ({ type: 'paragraph', content });
const text = (value: string, marks?: RichtextNode['marks']): RichtextNode => ({
  type: 'text',
  text: value,
  marks,
});
const listItem = (...content: RichtextNode[]): RichtextNode => ({ type: 'list_item', content });

describe('richtextToMarkdown — blocks', () => {
  it('serializes a paragraph', () => {
    expect(richtextToMarkdown(doc(p(text('Hello world'))))).toBe('Hello world');
  });

  it('serializes headings h1–h4', () => {
    for (const level of [1, 2, 3, 4]) {
      const node = doc({ type: 'heading', attrs: { level }, content: [text('Title')] });
      expect(richtextToMarkdown(node)).toBe(`${'#'.repeat(level)} Title`);
    }
  });

  it('clamps out-of-range / missing heading levels', () => {
    expect(richtextToMarkdown(doc({ type: 'heading', attrs: {}, content: [text('X')] }))).toBe('# X');
    expect(
      richtextToMarkdown(doc({ type: 'heading', attrs: { level: 9 }, content: [text('X')] })),
    ).toBe('###### X');
  });

  it('joins block siblings with a blank line', () => {
    expect(richtextToMarkdown(doc(p(text('a')), p(text('b'))))).toBe('a\n\nb');
  });

  it('serializes a bullet list', () => {
    const node = doc({
      type: 'bullet_list',
      content: [listItem(p(text('one'))), listItem(p(text('two')))],
    });
    expect(richtextToMarkdown(node)).toBe('- one\n- two');
  });

  it('serializes an ordered list with incrementing markers', () => {
    const node = doc({
      type: 'ordered_list',
      content: [listItem(p(text('one'))), listItem(p(text('two')))],
    });
    expect(richtextToMarkdown(node)).toBe('1. one\n2. two');
  });

  it('serializes nested lists with indentation', () => {
    const node = doc({
      type: 'bullet_list',
      content: [
        listItem(p(text('parent')), {
          type: 'bullet_list',
          content: [listItem(p(text('child')))],
        }),
      ],
    });
    expect(richtextToMarkdown(node)).toBe('- parent\n  - child');
  });

  it('handles an empty list item', () => {
    const node = doc({ type: 'bullet_list', content: [listItem()] });
    expect(richtextToMarkdown(node)).toBe('- ');
  });

  it('serializes a code block with an allow-listed language', () => {
    const node = doc({
      type: 'code_block',
      attrs: { class: 'language-js' },
      content: [text('const x = 1;')],
    });
    expect(richtextToMarkdown(node)).toBe('```js\nconst x = 1;\n```');
  });

  it('collapses an unknown code-block language to plaintext', () => {
    const node = doc({
      type: 'code_block',
      attrs: { class: 'language-cobol' },
      content: [text('DISPLAY.')],
    });
    expect(richtextToMarkdown(node)).toBe('```plaintext\nDISPLAY.\n```');
  });

  it('emits a bare fence when the code block has no language', () => {
    const node = doc({ type: 'code_block', attrs: {}, content: [text('plain')] });
    expect(richtextToMarkdown(node)).toBe('```\nplain\n```');
  });

  it('expands the fence when code contains a backtick run', () => {
    const node = doc({
      type: 'code_block',
      attrs: { class: 'language-md' },
      content: [text('```\nnested\n```')],
    });
    expect(richtextToMarkdown(node)).toBe('````md\n```\nnested\n```\n````');
  });

  it('serializes a blockquote', () => {
    const node = doc({ type: 'blockquote', content: [p(text('quote'))] });
    expect(richtextToMarkdown(node)).toBe('> quote');
  });

  it('serializes a horizontal rule', () => {
    expect(richtextToMarkdown(doc({ type: 'horizontal_rule' }))).toBe('---');
  });

  it('serializes a block image', () => {
    const node = doc({ type: 'image', attrs: { src: 'https://x/y.png', alt: 'pic' } });
    expect(richtextToMarkdown(node)).toBe('![pic](https://x/y.png)');
  });

  it('drops an image with no src', () => {
    expect(richtextToMarkdown(doc({ type: 'image', attrs: { alt: 'x' } }))).toBe('');
  });

  it('serializes a GFM table', () => {
    const cell = (value: string, header = false): RichtextNode => ({
      type: header ? 'tableHeader' : 'tableCell',
      content: [p(text(value))],
    });
    const node = doc({
      type: 'table',
      content: [
        { type: 'tableRow', content: [cell('H1', true), cell('H2', true)] },
        { type: 'tableRow', content: [cell('C1'), cell('C2')] },
      ],
    });
    expect(richtextToMarkdown(node)).toBe('| H1 | H2 |\n| --- | --- |\n| C1 | C2 |');
  });

  it('returns empty string for an empty table', () => {
    expect(richtextToMarkdown(doc({ type: 'table', content: [] }))).toBe('');
  });
});

describe('richtextToMarkdown — inline marks', () => {
  it('applies bold, italic, strike and inline code', () => {
    expect(richtextToMarkdown(doc(p(text('b', [{ type: 'bold' }]))))).toBe('**b**');
    expect(richtextToMarkdown(doc(p(text('i', [{ type: 'italic' }]))))).toBe('*i*');
    expect(richtextToMarkdown(doc(p(text('s', [{ type: 'strike' }]))))).toBe('~~s~~');
    expect(richtextToMarkdown(doc(p(text('c', [{ type: 'code' }]))))).toBe('`c`');
  });

  it('applies a link mark', () => {
    const node = doc(p(text('here', [{ type: 'link', attrs: { href: 'https://a.b' } }])));
    expect(richtextToMarkdown(node)).toBe('[here](https://a.b)');
  });

  it('nests stacked marks in array order', () => {
    const node = doc(
      p(text('x', [{ type: 'bold' }, { type: 'link', attrs: { href: 'u' } }])),
    );
    expect(richtextToMarkdown(node)).toBe('[**x**](u)');
  });

  it('ignores an unknown mark type', () => {
    expect(richtextToMarkdown(doc(p(text('x', [{ type: 'highlight' }]))))).toBe('x');
  });

  it('renders hard breaks as newlines', () => {
    const node = doc(p(text('a'), { type: 'hard_break' }, text('b')));
    expect(richtextToMarkdown(node)).toBe('a\nb');
  });
});

describe('richtextToMarkdown — edge cases', () => {
  it('returns empty string for null/undefined', () => {
    expect(richtextToMarkdown(undefined)).toBe('');
    expect(richtextToMarkdown(null)).toBe('');
  });

  it('skips (never throws on) an unknown node type', () => {
    expect(richtextToMarkdown(doc({ type: 'mystery_widget' }))).toBe('');
  });

  it('serializes a single non-doc node directly', () => {
    expect(richtextToMarkdown(p(text('loose')))).toBe('loose');
  });
});

describe('richtextToPlainText', () => {
  it('strips marks and excludes code blocks', () => {
    const node = doc(
      p(text('Read '), text('this', [{ type: 'bold' }])),
      { type: 'code_block', attrs: { class: 'language-js' }, content: [text('secret()')] },
      p(text('after')),
    );
    const out = richtextToPlainText(node);
    expect(out).toContain('Read this');
    expect(out).toContain('after');
    expect(out).not.toContain('secret()');
    expect(out).not.toContain('**');
  });

  it('flattens list and heading text', () => {
    const node = doc(
      { type: 'heading', attrs: { level: 2 }, content: [text('Head')] },
      { type: 'bullet_list', content: [listItem(p(text('a'))), listItem(p(text('b')))] },
    );
    expect(richtextToPlainText(node)).toBe('Head\n\na\nb');
  });

  it('returns empty string for null and unknown nodes', () => {
    expect(richtextToPlainText(null)).toBe('');
    expect(richtextToPlainText(p(text('x')))).toBe('x');
  });
});

describe('richtextToMarkdown — defensive branches', () => {
  it('serializes inline images and skips srcless/textless/unknown inline nodes', () => {
    const node = doc(
      p(
        { type: 'image', attrs: { src: 'i.png', alt: 'a' } },
        { type: 'image', attrs: {} },
        { type: 'text' },
        { type: 'weird_inline' },
      ),
    );
    expect(richtextToMarkdown(node)).toBe('![a](i.png)');
  });

  it('handles an empty mark array and a link mark without attrs', () => {
    expect(richtextToMarkdown(doc(p(text('x', []))))).toBe('x');
    expect(richtextToMarkdown(doc(p(text('y', [{ type: 'link' }]))))).toBe('[y]()');
  });

  it('tolerates nodes with missing content/attrs', () => {
    expect(richtextToMarkdown({ type: 'doc' })).toBe('');
    expect(richtextToMarkdown({ type: 'paragraph' })).toBe('');
    expect(richtextToMarkdown({ type: 'heading' })).toBe('# ');
    expect(richtextToMarkdown({ type: 'blockquote' })).toBe('>');
    expect(richtextToMarkdown({ type: 'bullet_list' })).toBe('');
    expect(richtextToMarkdown({ type: 'table' })).toBe('');
    expect(richtextToMarkdown({ type: 'code_block' })).toBe('```\n\n```');
  });

  it('serializes list items: empty, block child, and continuation lines', () => {
    expect(richtextToMarkdown(doc({ type: 'bullet_list', content: [{ type: 'list_item' }] }))).toBe('- ');

    const withCode = doc({
      type: 'bullet_list',
      content: [listItem({ type: 'code_block', attrs: { class: 'language-js' }, content: [text('x')] })],
    });
    expect(richtextToMarkdown(withCode)).toBe('- ```js\nx\n```');

    const twoParagraphs = doc({
      type: 'bullet_list',
      content: [listItem(p(text('first')), p(text('second')))],
    });
    expect(richtextToMarkdown(twoParagraphs)).toBe('- first\n  second');
  });

  it('does not emit an orphan marker when an item is only a nested list', () => {
    const node = doc({
      type: 'bullet_list',
      content: [listItem({ type: 'bullet_list', content: [listItem(p(text('child')))] })],
    });
    expect(richtextToMarkdown(node)).toBe('  - child');
  });

  it('serializes tables with missing row/header content and multi-block cells', () => {
    expect(richtextToMarkdown(doc({ type: 'table', content: [{ type: 'tableRow' }] }))).toBe('|  |\n|  |');

    const multiBlock = doc({
      type: 'table',
      content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [p(text('a')), p(text('b'))] }] }],
    });
    expect(richtextToMarkdown(multiBlock)).toContain('| a b |');
  });

  it('covers nested doc, textless code child, list paragraph and empty cell', () => {
    expect(richtextToMarkdown(doc({ type: 'doc', content: [p(text('n'))] }))).toBe('n');
    expect(richtextToMarkdown(doc({ type: 'code_block', attrs: {}, content: [{ type: 'text' }] }))).toBe('```\n\n```');
    expect(richtextToMarkdown(doc({ type: 'bullet_list', content: [listItem({ type: 'paragraph' })] }))).toBe('- ');
    expect(
      richtextToMarkdown(doc({ type: 'table', content: [{ type: 'tableRow', content: [{ type: 'tableCell' }] }] })),
    ).toBe('|  |\n| --- |');
  });
});

describe('richtextToPlainText — defensive branches', () => {
  it('covers hard breaks, unknown inline, blockquote and table prose', () => {
    const node = doc(
      p(text('a'), { type: 'hard_break' }, { type: 'unknown_inline' }, { type: 'text' }),
      { type: 'blockquote', content: [p(text('quoted'))] },
      { type: 'bullet_list', content: [listItem(), listItem(p(text('kept')))] },
      { type: 'table', content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [p(text('c'))] }] }] },
      { type: 'mystery_block' },
    );
    const out = richtextToPlainText(node);
    expect(out).toContain('a\n');
    expect(out).toContain('quoted');
    expect(out).toContain('kept');
    expect(out).toContain('c');
  });

  it('tolerates missing content', () => {
    expect(richtextToPlainText({ type: 'doc' })).toBe('');
    expect(richtextToPlainText({ type: 'unknown_block' })).toBe('');
  });

  it('covers nested doc and every content-less block variant', () => {
    expect(richtextToPlainText(doc({ type: 'doc', content: [p(text('n'))] }))).toBe('n');
    const node = doc(
      { type: 'paragraph' },
      { type: 'blockquote' },
      { type: 'bullet_list' },
      { type: 'bullet_list', content: [{ type: 'list_item' }] },
      { type: 'table' },
      { type: 'table', content: [{ type: 'tableRow' }] },
      { type: 'table', content: [{ type: 'tableRow', content: [{ type: 'tableCell' }] }] },
    );
    expect(richtextToPlainText(node)).toBe('');
  });
});

describe('collectRichtextCodeSamples', () => {
  it('collects code blocks anywhere in the tree', () => {
    const node = doc(
      p(text('intro')),
      { type: 'code_block', attrs: { class: 'language-ts' }, content: [text('const a = 1;')] },
      { type: 'blockquote', content: [{ type: 'code_block', attrs: {}, content: [text('nested')] }] },
    );
    expect(collectRichtextCodeSamples(node)).toEqual([
      { name: '', language: 'ts', code: 'const a = 1;' },
      { name: '', language: '', code: 'nested' },
    ]);
  });

  it('returns empty array for null', () => {
    expect(collectRichtextCodeSamples(null)).toEqual([]);
  });
});

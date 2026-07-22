import { describe, it, expect, vi } from 'vitest';
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';

// Simulate @shikijs/rehype: turn every <pre> into a `pre.shiki`, mirroring
// `addLanguageClass` by copying the child <code>'s `language-*` onto the <pre>.
// This lets us exercise rehypeCodeFrame (which keys off the `shiki` class)
// without the native Shiki binary, which doesn't run under jsdom.
vi.mock('@shikijs/rehype', () => ({
  default: () => (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre') return;
      const code = node.children.find(
        (c): c is Element => c.type === 'element' && c.tagName === 'code'
      );
      const codeCls = code?.properties?.className;
      const lang = (Array.isArray(codeCls) ? codeCls.map(String) : []).find((c) =>
        c.startsWith('language-')
      );
      node.properties = { ...node.properties, className: ['shiki', ...(lang ? [lang] : [])] };
    });
    return tree;
  },
}));

describe('rehypeCodeFrame (richtext code blocks)', () => {
  it('wraps a highlighted code block in a code-frame with its language label', async () => {
    const { processRichtext } = await import('@/lib/richtext-pipeline');
    const html = await processRichtext('<pre><code class="language-js">const a = 1;</code></pre>');
    expect(html).toContain('class="code-frame"');
    expect(html).toContain('class="code-frame__title"');
    expect(html).toContain('<span class="code-frame__label">js</span>');
    expect(html).toContain('class="shiki');
  });

  it('labels a language-less code block "text"', async () => {
    const { processRichtext } = await import('@/lib/richtext-pipeline');
    const html = await processRichtext('<pre><code>plain</code></pre>');
    expect(html).toContain('class="code-frame"');
    expect(html).toContain('<span class="code-frame__label">text</span>');
  });

  it('does not double-wrap a pre already inside a code-frame figure (markdown fence)', async () => {
    const { processRichtext } = await import('@/lib/richtext-pipeline');
    const framed =
      '<figure class="code-frame"><figcaption class="code-frame__title">' +
      '<span class="code-frame__label">src/foo.ts(ts)</span></figcaption>' +
      '<pre><code class="language-ts">const a = 1;</code></pre></figure>';
    const html = await processRichtext(framed);
    // exactly one code-frame figure — the plugin skipped the pre-framed fence
    expect(html.match(/class="code-frame"/g)?.length).toBe(1);
    expect(html).toContain('src/foo.ts(ts)');
  });
});

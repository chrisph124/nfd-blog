import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize from 'rehype-sanitize';
import rehypeShiki from '@shikijs/rehype';
import { visit } from 'unist-util-visit';
import type { Root, Element, Text, Parent } from 'hast';
import { richtextSanitizeSchema } from './richtext-sanitize-schema';
import { shikiRehypeOptions } from './shiki-theme';
import { buildCodeLabel } from './code-frame';
import { getYouTubeId, isYouTubeUrl } from './youtube';

/** Normalize a HAST node's className (array | string | absent) to string[]. */
function classList(node: Element): string[] {
  const cls = node.properties?.className;
  if (Array.isArray(cls)) return cls.map(String);
  if (typeof cls === 'string') return cls.split(/\s+/).filter(Boolean);
  return [];
}

/**
 * Wrap each highlighted `pre.shiki` in the macOS code-frame (a header carrying
 * traffic-light dots via CSS + the language label). Skips a `pre` already inside
 * a `.code-frame` figure — those are Markdown fences, framed with their filename
 * by `renderCode`. Runs AFTER rehypeShiki so `pre.shiki` and its `language-*`
 * class (from `addLanguageClass`) exist; the second visit of the now-nested pre
 * is a no-op because its parent is then a `.code-frame` figure.
 */
function rehypeCodeFrame() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent: Parent | undefined) => {
      if (node.tagName !== 'pre' || parent === undefined || index === undefined) return;
      if (!classList(node).includes('shiki')) return;
      if (
        parent.type === 'element' &&
        (parent as Element).tagName === 'figure' &&
        classList(parent as Element).includes('code-frame')
      ) {
        return;
      }

      const langClass = classList(node).find((c) => c.startsWith('language-'));
      const language = langClass ? langClass.slice('language-'.length) : '';
      const label = buildCodeLabel(undefined, language);

      const figure: Element = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['code-frame'] },
        children: [
          {
            type: 'element',
            tagName: 'figcaption',
            properties: { className: ['code-frame__title'] },
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: { className: ['code-frame__label'] },
                children: [{ type: 'text', value: label }],
              },
            ],
          },
          node,
        ],
      };
      parent.children.splice(index, 1, figure);
    });
  };
}

/**
 * Rehype plugin to add lazy loading attributes to media elements
 * - Adds loading="lazy" to <img> and <iframe> tags
 * - Adds preload="none" to <video> tags
 */
function rehypeLazyLoading() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'img' && !node.properties?.loading) {
        node.properties = { ...node.properties, loading: 'lazy' };
      }
      if (node.tagName === 'iframe' && !node.properties?.loading) {
        node.properties = { ...node.properties, loading: 'lazy' };
      }
      if (node.tagName === 'video' && !node.properties?.preload) {
        node.properties = { ...node.properties, preload: 'none' };
      }
    });
  };
}

/**
 * Get text content from a HAST node
 */
function getTextContent(node: Element | Text): string {
  if (node.type === 'text') return node.value;
  // Narrowed to Element here, which always carries a `children` array.
  return node.children
    .filter((child): child is Text | Element => child.type === 'text' || child.type === 'element')
    .map(child => getTextContent(child))
    .join('');
}

/**
 * Rehype plugin to detect markdown-like patterns in <p> elements
 * and convert them to semantic HTML (headings, lists, inline code, bold).
 * Runs BEFORE sanitize to convert markdown patterns first.
 */
function rehypeMarkdownDetect() {
  return (tree: Root) => {
    const parent = tree as Parent;

    // Pass 1: Convert heading paragraphs (# ## ### ####)
    const headingNodes: Array<{ node: Element; index: number; level: number; text: string }> = [];
    visit(parent, 'element', (node: Element, index) => {
      if (node.tagName !== 'p' || index === undefined) return;
      const textContent = getTextContent(node);
      const match = textContent.match(/^(#{1,4})\s+(\S.*)$/);
      if (match) {
        headingNodes.push({ node, index, level: match[1].length, text: match[2] });
      }
    });

    // Apply heading conversions in reverse order to preserve indices
    for (let i = headingNodes.length - 1; i >= 0; i--) {
      // eslint-disable-next-line security/detect-object-injection -- safe: i is a loop counter from length
      const heading = headingNodes[i];
      heading.node.tagName = `h${heading.level}`;
      heading.node.children = [{ type: 'text', value: heading.text }];
    }

    // Pass 2: Convert inline backticks and bold within text nodes
    visit(parent, 'text', (node: Text, index, parentNode) => {
      if (!parentNode || parentNode.type !== 'element' || index === undefined) return;
      const parentElem = parentNode as Element;
      if (parentElem.tagName !== 'p' && parentElem.tagName !== 'h1' &&
          parentElem.tagName !== 'h2' && parentElem.tagName !== 'h3' &&
          parentElem.tagName !== 'h4' && parentElem.tagName !== 'li') return;

      const value = node.value;

      // Convert **bold** to <strong>
      const boldMatch = value.match(/\*\*(.+?)\*\*/);
      if (boldMatch) {
        const matchIndex = boldMatch.index ?? 0;
        const before = value.slice(0, matchIndex);
        const boldText = boldMatch[1];
        const after = value.slice(matchIndex + boldMatch[0].length);

        const newNodes: (Text | Element)[] = [];
        if (before) newNodes.push({ type: 'text', value: before });
        newNodes.push({ type: 'element', tagName: 'strong', children: [{ type: 'text', value: boldText }], properties: {} });
        if (after) newNodes.push({ type: 'text', value: after });

        parentElem.children.splice(index, 1, ...newNodes);
        return;
      }

      // Convert `inline` to <code>
      const codeMatch = value.match(/`([^`]+)`/);
      if (codeMatch) {
        const codeIndex = value.indexOf(codeMatch[0]);
        const before = value.slice(0, codeIndex);
        const codeText = codeMatch[1];
        const after = value.slice(codeIndex + codeMatch[0].length);

        const newNodes: (Text | Element)[] = [];
        if (before) newNodes.push({ type: 'text', value: before });
        newNodes.push({ type: 'element', tagName: 'code', children: [{ type: 'text', value: codeText }], properties: {} });
        if (after) newNodes.push({ type: 'text', value: after });

        const parentElem = parentNode as Element;
        parentElem.children.splice(index, 1, ...newNodes);
      }
    });
  };
}

/**
 * Return true when a <p> holds exactly one element child and no other
 * (non-whitespace) text — i.e. a standalone image or link on its own line.
 */
function soleElementChild(node: Element): Element | null {
  const elements = node.children.filter(
    (child): child is Element => child.type === 'element'
  );
  const hasText = node.children.some(
    (child) => child.type === 'text' && child.value.trim() !== ''
  );
  return elements.length === 1 && !hasText ? elements[0] : null;
}

/**
 * Wrap a standalone markdown image (an <img> alone in a <p>) in
 * <figure class="image-figure">, moving the image's `title` into a
 * <figcaption>. Runs AFTER sanitize so the injected figure is trusted.
 * Bare images (not inside a <p>) are left untouched.
 */
function rehypeImageFigure() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent: Parent | undefined) => {
      if (node.tagName !== 'p' || parent === undefined || index === undefined) return;

      const img = soleElementChild(node);
      if (!img || img.tagName !== 'img') return;

      const properties = { ...(img.properties ?? {}) };
      const rawTitle = properties.title;
      const caption =
        typeof rawTitle === 'string' && rawTitle.trim() !== '' ? rawTitle : undefined;

      // The title now lives in the caption; drop it to avoid a duplicate tooltip.
      delete properties.title;
      img.properties = properties;

      const figureChildren: Element[] = [img];
      if (caption) {
        figureChildren.push({
          type: 'element',
          tagName: 'figcaption',
          properties: { className: ['image-figure__caption'] },
          children: [{ type: 'text', value: caption }],
        });
      }

      const figure: Element = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['image-figure'] },
        children: figureChildren,
      };
      parent.children.splice(index, 1, figure);
    });
  };
}

/**
 * Replace a paragraph whose only content is a lone YouTube link with a
 * responsive <figure class="video-embed"> iframe. Links mixed with other text
 * stay as-is. Runs AFTER sanitize (the injected iframe is trusted and points
 * only at youtube.com/embed).
 */
function rehypeYouTubeEmbed() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent: Parent | undefined) => {
      if (node.tagName !== 'p' || parent === undefined || index === undefined) return;

      const anchor = soleElementChild(node);
      if (!anchor || anchor.tagName !== 'a') return;

      const href = anchor.properties?.href;
      if (typeof href !== 'string' || !isYouTubeUrl(href)) return;

      const videoId = getYouTubeId(href);
      if (!videoId) return;

      const iframe: Element = {
        type: 'element',
        tagName: 'iframe',
        properties: {
          src: `https://www.youtube.com/embed/${videoId}`,
          title: 'YouTube video player',
          loading: 'lazy',
          allow:
            'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowFullScreen: true,
        },
        children: [],
      };

      const figure: Element = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['video-embed'] },
        children: [iframe],
      };
      parent.children.splice(index, 1, figure);
    });
  };
}

/**
 * Process richtext HTML with unified/rehype pipeline
 * 1. Parse HTML to HAST
 * 2. Sanitize XSS
 * 3. Syntax highlight code blocks with Shiki (dual themes)
 * 4. Add lazy loading attributes
 * 5. Serialize back to HTML
 */
export async function processRichtext(html: string): Promise<string> {
  const result = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, richtextSanitizeSchema) // sanitize XSS BEFORE markdown detection
    .use(rehypeMarkdownDetect) // detect markdown patterns after sanitize
    .use(rehypeShiki, shikiRehypeOptions)
    .use(rehypeCodeFrame) // wrap richtext code blocks in the macOS code-frame
    .use(rehypeImageFigure) // wrap standalone images in a captioned figure
    .use(rehypeYouTubeEmbed) // embed a lone YouTube URL as a responsive iframe
    .use(rehypeLazyLoading)
    .use(rehypeStringify)
    .process(html);

  return String(result);
}

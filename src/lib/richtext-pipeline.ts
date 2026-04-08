import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeShiki from '@shikijs/rehype';
import { visit } from 'unist-util-visit';
import type { Root, Element, Text, Parent } from 'hast';

// Custom sanitize schema — allow Storyblok content tags with strict XSS protection
const sanitizeSchema = {
  ...defaultSchema,
  protocols: {
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https'],
  },
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img || []), 'loading', 'srcset', 'sizes'],
    iframe: [...(defaultSchema.attributes?.iframe || []), 'loading', 'src', 'allowfullscreen'],
    video: [...(defaultSchema.attributes?.video || []), 'preload', 'src', 'controls'],
    // Shiki will add its own attributes AFTER sanitize, so no need to allow here
    code: [...(defaultSchema.attributes?.code || []), 'class'],
    pre: [...(defaultSchema.attributes?.pre || []), 'class'],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'iframe', 'video', 'source', 'figure', 'figcaption',
  ],
};

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
  if ('children' in node) {
    return node.children
      .filter((child): child is Text | Element => child.type === 'text' || child.type === 'element')
      .map(child => getTextContent(child))
      .join('');
  }
  return '';
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
    .use(rehypeSanitize, sanitizeSchema) // sanitize XSS BEFORE markdown detection
    .use(rehypeMarkdownDetect) // detect markdown patterns after sanitize
    .use(rehypeShiki, {
      themes: {
        light: 'one-dark-pro',
        dark: 'one-dark-pro',
      },
      defaultColor: false, // CSS variables mode for light/dark switching
    })
    .use(rehypeLazyLoading)
    .use(rehypeStringify)
    .process(html);

  return String(result);
}

import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

// Re-implement the sanitize schema from the pipeline for testing
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
    code: [...(defaultSchema.attributes?.code || []), 'class'],
    pre: [...(defaultSchema.attributes?.pre || []), 'class'],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'iframe', 'video', 'source', 'figure', 'figcaption',
  ],
};

async function sanitizeHtml(html: string): Promise<string> {
  const result = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(html);
  return String(result);
}

describe('XSS Sanitization', () => {
  const xssPayloads = [
    { name: 'script tag', payload: '<script>alert("xss")</script>' },
    { name: 'img onerror', payload: '<img src=x onerror=alert(1)>' },
    { name: 'svg onload', payload: '<svg onload=alert(1)>' },
    { name: 'javascript href', payload: '<a href="javascript:alert(1)">click</a>' },
    { name: 'iframe javascript', payload: '<iframe src="javascript:alert(1)">' },
    { name: 'body onload', payload: '<body onload=alert(1)>' },
    { name: 'input onfocus', payload: '<input onfocus=alert(1) autofocus>' },
    { name: 'nested svg script', payload: '<svg><script>alert(1)</script></svg>' },
    { name: 'math onerror', payload: '<math><mi//src=x onerror=alert(1)>' },
    { name: 'data URL img', payload: '<img src="data:text/html,<script>alert(1)</script>">' },
    { name: 'svg img xlink', payload: '<svg><img src=x onerror=alert(1)></svg>' },
    { name: 'anchor id', payload: '<a id="test" href="javascript:alert(1)">link</a>' },
    { name: 'form action', payload: '<form action="javascript:alert(1)"><button>go</button></form>' },
    { name: 'base href', payload: '<base href="javascript:alert(1)//">' },
    { name: 'link href', payload: '<link rel="stylesheet" href="javascript:alert(1)">' },
  ];

  for (const { name, payload } of xssPayloads) {
    it(`blocks ${name}`, async () => {
      const result = await sanitizeHtml(payload);
      // Script tags should be completely removed
      if (payload.includes('<script')) {
        expect(result).not.toContain('<script');
      }
      // on* event handlers should be stripped
      if (payload.includes('onerror') || payload.includes('onload') || payload.includes('onfocus')) {
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('onload');
        expect(result).not.toContain('onfocus');
      }
      // javascript: URLs should be stripped from href
      if (payload.includes('javascript:')) {
        expect(result).not.toContain('javascript:');
      }
      // data: URLs should be stripped
      if (payload.includes('data:')) {
        expect(result).not.toContain('data:');
      }
    });
  }

  describe('Protocol Restrictions', () => {
    it('allows http URLs in href', async () => {
      const result = await sanitizeHtml('<a href="http://example.com">link</a>');
      expect(result).toContain('http://example.com');
    });

    it('allows https URLs in href', async () => {
      const result = await sanitizeHtml('<a href="https://example.com">link</a>');
      expect(result).toContain('https://example.com');
    });

    it('allows mailto URLs in href', async () => {
      const result = await sanitizeHtml('<a href="mailto:test@example.com">email</a>');
      expect(result).toContain('mailto:test@example.com');
    });

    it('blocks javascript: URLs in href', async () => {
      const result = await sanitizeHtml('<a href="javascript:alert(1)">click</a>');
      expect(result).not.toContain('javascript:');
    });

    it('allows http URLs in img src', async () => {
      const result = await sanitizeHtml('<img src="http://example.com/image.jpg" alt="test" />');
      expect(result).toContain('http://example.com/image.jpg');
    });

    it('allows https URLs in img src', async () => {
      const result = await sanitizeHtml('<img src="https://example.com/image.jpg" alt="test" />');
      expect(result).toContain('https://example.com/image.jpg');
    });

    it('blocks data: URLs in img src', async () => {
      const result = await sanitizeHtml('<img src="data:image/png;base64,abc" alt="test" />');
      expect(result).not.toContain('data:');
    });
  });

  describe('Allowed Content', () => {
    it('preserves safe img tags', async () => {
      const result = await sanitizeHtml('<img src="https://example.com/image.jpg" alt="test" />');
      expect(result).toContain('<img');
      expect(result).toContain('alt="test"');
    });

    it('preserves safe iframe tags', async () => {
      const result = await sanitizeHtml('<iframe src="https://youtube.com/embed/abc" loading="lazy" allowfullscreen></iframe>');
      expect(result).toContain('<iframe');
      expect(result).toContain('src="https://youtube.com/embed/abc"');
    });

    it('preserves video tags', async () => {
      const result = await sanitizeHtml('<video src="https://example.com/video.mp4" controls preload="none"></video>');
      expect(result).toContain('<video');
      expect(result).toContain('preload="none"');
    });

    it('preserves code blocks', async () => {
      const result = await sanitizeHtml('<pre><code class="language-js">const x = 1;</code></pre>');
      expect(result).toContain('<pre');
      expect(result).toContain('<code');
    });

    it('preserves figure and figcaption', async () => {
      const result = await sanitizeHtml('<figure><img src="img.jpg" alt="test" /><figcaption>Caption</figcaption></figure>');
      expect(result).toContain('<figure');
      expect(result).toContain('<figcaption');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty input', async () => {
      const result = await sanitizeHtml('');
      expect(result).toBe('');
    });

    it('handles plain text without HTML', async () => {
      const result = await sanitizeHtml('Just plain text without any HTML.');
      expect(result).toContain('Just plain text');
    });

    it('handles malformed HTML gracefully', async () => {
      const result = await sanitizeHtml('<p>Unclosed paragraph');
      expect(result).toBeDefined();
    });

    it('preserves heading structure', async () => {
      const result = await sanitizeHtml('<h1>Heading</h1><h2>Subheading</h2>');
      expect(result).toContain('<h1');
      expect(result).toContain('<h2');
    });

    it('preserves list structure', async () => {
      const result = await sanitizeHtml('<ul><li>Item 1</li><li>Item 2</li></ul>');
      expect(result).toContain('<ul');
      expect(result).toContain('<li');
    });
  });
});

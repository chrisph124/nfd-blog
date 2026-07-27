import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processRichtext } from '@/lib/richtext-pipeline';

// Mock @shikijs/rehype to avoid server-only bundle issues in tests
// Shiki requires native binaries that don't work in jsdom environment
vi.mock('@shikijs/rehype', () => ({
  default: () => (tree: unknown) => tree,
}));

describe('processRichtext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty and whitespace input', () => {
    it('returns empty string for empty input', async () => {
      const result = await processRichtext('');
      expect(result).toBe('');
    });

    it('preserves whitespace-only input (not stripped by pipeline)', async () => {
      const result = await processRichtext('   \n\t  ');
      expect(result.trim()).toBe('');
    });
  });

  describe('Basic HTML pass-through', () => {
    it('preserves basic paragraph HTML', async () => {
      const html = '<p>Hello world</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<p>Hello world</p>');
    });

    it('preserves multiple paragraphs', async () => {
      const html = '<p>First paragraph</p><p>Second paragraph</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<p>First paragraph</p>');
      expect(result).toContain('<p>Second paragraph</p>');
    });
  });

  describe('Markdown heading detection', () => {
    it.each([
      { name: 'converts h1 markdown pattern to h1 tag', markdown: '# Project Context', expected: '<h1>Project Context</h1>' },
      { name: 'converts h2 markdown pattern to h2 tag', markdown: '## Tech Stack', expected: '<h2>Tech Stack</h2>' },
      { name: 'converts h3 markdown pattern to h3 tag', markdown: '### Subheading', expected: '<h3>Subheading</h3>' },
      { name: 'converts h4 markdown pattern to h4 tag', markdown: '#### Deep heading', expected: '<h4>Deep heading</h4>' },
    ])('$name', async ({ markdown, expected }) => {
      const html = `<p>${markdown}</p>`;
      const result = await processRichtext(html);
      expect(result).toContain(expected);
    });

    it('does NOT convert hashtag without space after #', async () => {
      const html = '<p>#hashtag</p>';
      const result = await processRichtext(html);
      expect(result).not.toContain('<h');
      expect(result).toContain('#hashtag');
    });

    it('does NOT convert # followed by number', async () => {
      const html = '<p>#1 ranking</p>';
      const result = await processRichtext(html);
      expect(result).not.toContain('<h');
      expect(result).toContain('#1 ranking');
    });

    it('does NOT convert heading pattern inside pre tag', async () => {
      const html = '<pre># Code heading</pre>';
      const result = await processRichtext(html);
      expect(result).toContain('<pre>');
      expect(result).not.toContain('<h1>');
    });
  });

  describe('Bold conversion', () => {
    it.each([
      { name: 'converts **bold** pattern to strong tag', html: '<p>This is **bold** text</p>', expected: '<strong>bold</strong>' },
      { name: 'handles bold at start of text', html: '<p>**Bold start** regular text</p>', expected: '<strong>Bold start</strong>' },
      { name: 'handles bold at end of text', html: '<p>Regular text **bold end**</p>', expected: '<strong>bold end</strong>' },
    ])('$name', async ({ html, expected }) => {
      const result = await processRichtext(html);
      expect(result).toContain(expected);
    });

    it('converts multiple bold patterns in same paragraph', async () => {
      const html = '<p>**First** and **second** bold</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<strong>First</strong>');
      expect(result).toContain('<strong>second</strong>');
    });
  });

  describe('Inline code conversion', () => {
    it.each([
      { name: 'converts inline backticks to code tag', html: '<p>Use `npm install`</p>', expected: '<code>npm install</code>' },
      { name: 'handles code at start of text', html: '<p>`code` at start</p>', expected: '<code>code</code>' },
      { name: 'handles code at end of text', html: '<p>end with `code`</p>', expected: '<code>code</code>' },
    ])('$name', async ({ html, expected }) => {
      const result = await processRichtext(html);
      expect(result).toContain(expected);
    });

    it('handles multiple inline code in same paragraph', async () => {
      const html = '<p>Use `git` and `npm` commands</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<code>git</code>');
      expect(result).toContain('<code>npm</code>');
    });
  });

  describe('Lazy loading attributes', () => {
    it.each([
      { name: 'adds loading="lazy" to img tags without loading attribute', html: '<img src="image.jpg" alt="test">', expected: 'loading="lazy"' },
      { name: 'adds loading="lazy" to iframe tags without loading attribute', html: '<iframe src="https://example.com"></iframe>', expected: 'loading="lazy"' },
      { name: 'adds preload="none" to video tags', html: '<video src="video.mp4"></video>', expected: 'preload="none"' },
    ])('$name', async ({ html, expected }) => {
      const result = await processRichtext(html);
      expect(result).toContain(expected);
    });

    it('preserves existing loading attribute on img', async () => {
      const html = '<img src="image.jpg" alt="test" loading="eager">';
      const result = await processRichtext(html);
      expect(result).toContain('loading="eager"');
      expect(result).not.toContain('loading="lazy"');
    });

    it('preserves existing preload attribute on video', async () => {
      const html = '<video src="video.mp4" preload="auto"></video>';
      const result = await processRichtext(html);
      expect(result).toContain('preload="auto"');
      expect(result).not.toContain('preload="none"');
    });
  });

  describe('XSS sanitization', () => {
    it('strips script tags', async () => {
      const html = '<p>Hello</p><script>alert("xss")</script>';
      const result = await processRichtext(html);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('strips onerror attributes from img', async () => {
      const html = '<img src="x" onerror="alert(1)">';
      const result = await processRichtext(html);
      expect(result).not.toContain('onerror');
    });

    it('strips javascript: href attributes', async () => {
      const html = '<a href="javascript:alert(1)">Click</a>';
      const result = await processRichtext(html);
      expect(result).not.toContain('javascript:');
    });

    it('allows safe protocol hrefs (http)', async () => {
      const html = '<a href="http://example.com">Link</a>';
      const result = await processRichtext(html);
      expect(result).toContain('http://example.com');
    });

    it('allows safe protocol hrefs (https)', async () => {
      const html = '<a href="https://example.com">Link</a>';
      const result = await processRichtext(html);
      expect(result).toContain('https://example.com');
    });
  });

  describe('Combined content', () => {
    it('handles heading with bold in separate elements', async () => {
      const html = '<p>## Use npm and **package** manager</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<h2>');
      expect(result).toContain('<strong>package</strong>');
    });

    it('handles multiple elements with different transformations', async () => {
      const html = '<p># Title</p><p>Paragraph with `code`</p><p>Text with **bold**</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<code>code</code>');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('handles list item with bold only', async () => {
      const html = '<li>Text and **bold** item</li>';
      const result = await processRichtext(html);
      expect(result).toContain('<strong>bold</strong>');
    });
  });

  describe('Code frame (Astro-style filename header)', () => {
    // Shiki is mocked in this file, so this asserts the frame survives SANITIZE
    // (the schema change is the real risk). Real Shiki highlighting is covered
    // by highlight-code.test.ts.
    it('preserves figure.code-frame + figcaption class through sanitize', async () => {
      const html =
        '<figure class="code-frame"><figcaption class="code-frame__title">src/foo.ts</figcaption>' +
        '<pre><code class="language-ts">const a = 1;</code></pre></figure>';
      const result = await processRichtext(html);
      expect(result).toContain('class="code-frame"');
      expect(result).toContain('code-frame__title');
      expect(result).toContain('src/foo.ts');
      expect(result).toContain('class="language-ts"');
    });
  });

  describe('Inline image figure', () => {
    it('wraps a markdown image (img in a p) in figure.image-figure', async () => {
      const html = '<p><img src="https://a.com/x.png" alt="Alt"></p>';
      const result = await processRichtext(html);
      expect(result).toContain('class="image-figure"');
      expect(result).toContain('loading="lazy"');
    });

    it('renders a caption from the image title attribute', async () => {
      const html = '<p><img src="https://a.com/x.png" alt="Alt" title="My caption"></p>';
      const result = await processRichtext(html);
      expect(result).toContain('class="image-figure"');
      expect(result).toContain('<figcaption');
      expect(result).toContain('My caption');
    });

    it('omits the caption when the image has no title', async () => {
      const html = '<p><img src="https://a.com/x.png" alt="Alt"></p>';
      const result = await processRichtext(html);
      expect(result).toContain('class="image-figure"');
      expect(result).not.toContain('<figcaption');
    });

    it('does not wrap a bare img that is not inside a paragraph', async () => {
      const html = '<img src="https://a.com/x.png" alt="Alt">';
      const result = await processRichtext(html);
      expect(result).not.toContain('image-figure');
      expect(result).toContain('loading="lazy"');
    });
  });

  describe('Inline YouTube embed', () => {
    it('embeds a lone youtu.be URL as a responsive iframe', async () => {
      const html = '<p><a href="https://youtu.be/dQw4w9WgXcQ">https://youtu.be/dQw4w9WgXcQ</a></p>';
      const result = await processRichtext(html);
      expect(result).toContain('class="video-embed"');
      expect(result).toContain('youtube.com/embed/dQw4w9WgXcQ');
    });

    it('embeds a lone youtube.com watch URL', async () => {
      const html =
        '<p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">https://www.youtube.com/watch?v=dQw4w9WgXcQ</a></p>';
      const result = await processRichtext(html);
      expect(result).toContain('class="video-embed"');
      expect(result).toContain('youtube.com/embed/dQw4w9WgXcQ');
    });

    it('leaves a non-YouTube link untouched', async () => {
      const html = '<p><a href="https://example.com">https://example.com</a></p>';
      const result = await processRichtext(html);
      expect(result).not.toContain('video-embed');
      expect(result).toContain('href="https://example.com"');
    });

    it('does not embed a YouTube link mixed with other text', async () => {
      const html = '<p>Watch <a href="https://youtu.be/dQw4w9WgXcQ">this</a> now</p>';
      const result = await processRichtext(html);
      expect(result).not.toContain('video-embed');
    });
  });

  describe('Non-markdown patterns', () => {
    it('does not modify regular text with # character', async () => {
      const html = '<p>Shop #1 for deals</p>';
      const result = await processRichtext(html);
      expect(result).toContain('Shop #1 for deals');
    });

    it('does not modify text that looks like bold but is not', async () => {
      const html = '<p>Error** not closed properly</p>';
      const result = await processRichtext(html);
      expect(result).toContain('Error** not closed properly');
    });
  });
});

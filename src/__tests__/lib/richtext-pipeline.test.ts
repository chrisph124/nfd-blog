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
    it('converts h1 markdown pattern to h1 tag', async () => {
      const html = '<p># Project Context</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<h1>Project Context</h1>');
    });

    it('converts h2 markdown pattern to h2 tag', async () => {
      const html = '<p>## Tech Stack</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<h2>Tech Stack</h2>');
    });

    it('converts h3 markdown pattern to h3 tag', async () => {
      const html = '<p>### Subheading</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<h3>Subheading</h3>');
    });

    it('converts h4 markdown pattern to h4 tag', async () => {
      const html = '<p>#### Deep heading</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<h4>Deep heading</h4>');
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
    it('converts **bold** pattern to strong tag', async () => {
      const html = '<p>This is **bold** text</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<strong>bold</strong>');
    });

    it('converts multiple bold patterns in same paragraph', async () => {
      const html = '<p>**First** and **second** bold</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<strong>First</strong>');
      expect(result).toContain('<strong>second</strong>');
    });

    it('handles bold at start of text', async () => {
      const html = '<p>**Bold start** regular text</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<strong>Bold start</strong>');
    });

    it('handles bold at end of text', async () => {
      const html = '<p>Regular text **bold end**</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<strong>bold end</strong>');
    });
  });

  describe('Inline code conversion', () => {
    it('converts inline backticks to code tag', async () => {
      const html = '<p>Use `npm install`</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<code>npm install</code>');
    });

    it('handles multiple inline code in same paragraph', async () => {
      const html = '<p>Use `git` and `npm` commands</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<code>git</code>');
      expect(result).toContain('<code>npm</code>');
    });

    it('handles code at start of text', async () => {
      const html = '<p>`code` at start</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<code>code</code>');
    });

    it('handles code at end of text', async () => {
      const html = '<p>end with `code`</p>';
      const result = await processRichtext(html);
      expect(result).toContain('<code>code</code>');
    });
  });

  describe('Lazy loading attributes', () => {
    it('adds loading="lazy" to img tags without loading attribute', async () => {
      const html = '<img src="image.jpg" alt="test">';
      const result = await processRichtext(html);
      expect(result).toContain('loading="lazy"');
    });

    it('adds loading="lazy" to iframe tags without loading attribute', async () => {
      const html = '<iframe src="https://example.com"></iframe>';
      const result = await processRichtext(html);
      expect(result).toContain('loading="lazy"');
    });

    it('adds preload="none" to video tags', async () => {
      const html = '<video src="video.mp4"></video>';
      const result = await processRichtext(html);
      expect(result).toContain('preload="none"');
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

import { describe, it, expect } from 'vitest';
import { cn, getReadingTime, getStoryReadingTime, formatDate, normalizeStoryblokUrl, injectLazyLoading } from '@/lib/utils';

// Test interfaces for type safety
interface TestTextContent {
  type: string;
  text?: string;
  src?: string;
  children?: TestTextContent[];
}

interface TestRichTextBlock {
  content?: TestTextContent[];
  type?: string;
  text?: string;
}

describe('cn utility function', () => {
  describe('Basic functionality', () => {
    it('returns empty string for no arguments', () => {
      expect(cn()).toBe('');
    });

    it('returns single class unchanged', () => {
      expect(cn('text-red-500')).toBe('text-red-500');
    });

    it('combines multiple classes', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
    });
  });

  describe('Conditional classes (clsx)', () => {
    it('handles boolean conditions', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional');
      expect(cn('base', false && 'conditional')).toBe('base');
    });

    it('handles null and undefined', () => {
      expect(cn('base', null, undefined, 'end')).toBe('base end');
    });

    it('handles object syntax', () => {
      expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
    });

    it('handles array syntax', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('handles nested arrays', () => {
      expect(cn(['class1', ['class2', 'class3']])).toBe('class1 class2 class3');
    });
  });

  describe('Tailwind merge', () => {
    it('merges conflicting padding classes', () => {
      expect(cn('px-4', 'px-6')).toBe('px-6');
    });

    it('merges conflicting margin classes', () => {
      expect(cn('mt-2', 'mt-4')).toBe('mt-4');
    });

    it('merges conflicting text color classes', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('merges conflicting background classes', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('keeps non-conflicting classes', () => {
      expect(cn('text-red-500', 'bg-blue-500', 'p-4')).toBe('text-red-500 bg-blue-500 p-4');
    });

    it('merges responsive variants correctly', () => {
      expect(cn('md:text-red-500', 'md:text-blue-500')).toBe('md:text-blue-500');
    });

    it('keeps different responsive variants', () => {
      expect(cn('text-red-500', 'md:text-blue-500')).toBe('text-red-500 md:text-blue-500');
    });

    it('merges conflicting width classes', () => {
      expect(cn('w-4', 'w-8')).toBe('w-8');
    });

    it('merges conflicting flex classes', () => {
      expect(cn('flex-row', 'flex-col')).toBe('flex-col');
    });
  });

  describe('Combined clsx and tailwind-merge', () => {
    it('handles conditional with merge', () => {
      const isActive = true;
      expect(cn('px-4', isActive && 'px-6')).toBe('px-6');
    });

    it('handles object syntax with merge', () => {
      expect(cn('text-red-500', { 'text-blue-500': true })).toBe('text-blue-500');
    });

    it('handles complex combination', () => {
      const result = cn(
        'base-class',
        'px-4',
        true && 'conditional',
        false && 'skipped',
        { 'object-class': true },
        'px-6' // Should override px-4
      );
      expect(result).toBe('base-class conditional object-class px-6');
    });
  });

  describe('Edge cases', () => {
    it('handles empty strings', () => {
      expect(cn('', 'class1', '')).toBe('class1');
    });

    it('handles whitespace', () => {
      expect(cn('  ', 'class1')).toBe('class1');
    });

    it('handles duplicate classes', () => {
      // tailwind-merge only deduplicates conflicting Tailwind classes, not arbitrary duplicates
      expect(cn('class1', 'class1')).toBe('class1 class1');
    });

    it('preserves important modifier', () => {
      expect(cn('!text-red-500')).toBe('!text-red-500');
    });

    it('handles arbitrary values', () => {
      expect(cn('w-[100px]', 'h-[200px]')).toBe('w-[100px] h-[200px]');
    });
  });
});

describe('getReadingTime', () => {
  it('returns "1 min read" for empty string', () => {
    expect(getReadingTime('')).toBe('1 min read');
  });

  it('returns "1 min read" for null/undefined input', () => {
    expect(getReadingTime(null as unknown as string)).toBe('1 min read');
    expect(getReadingTime(undefined as unknown as string)).toBe('1 min read');
  });

  it('handles single word correctly', () => {
    expect(getReadingTime('hello')).toBe('1 min read');
  });

  it('calculates reading time for short text', () => {
    const text = 'word '.repeat(100); // 100 words
    expect(getReadingTime(text)).toBe('1 min read');
  });

  it('calculates reading time for longer text', () => {
    const text = 'word '.repeat(400); // 400 words
    expect(getReadingTime(text)).toBe('2 min read');
  });

  it('respects custom words per minute', () => {
    const text = 'word '.repeat(100);
    expect(getReadingTime(text, 50)).toBe('2 min read');
  });

  it('handles text with extra whitespace', () => {
    const text = '  word   word  word  ';
    expect(getReadingTime(text)).toBe('1 min read');
  });

  it('handles text with special characters', () => {
    const text = 'Hello, world! This is a test.';
    expect(getReadingTime(text)).toBe('1 min read');
  });

  it('calculates correctly for different word counts', () => {
    expect(getReadingTime('word '.repeat(250))).toBe('2 min read');
    expect(getReadingTime('word '.repeat(500))).toBe('3 min read');
    expect(getReadingTime('word '.repeat(1000))).toBe('5 min read');
  });
});

describe('getStoryReadingTime', () => {
  it('returns "1 min read" for empty body array', () => {
    expect(getStoryReadingTime([])).toBe('1 min read');
    expect(getStoryReadingTime(undefined)).toBe('1 min read');
    expect(getStoryReadingTime(null as unknown as TestRichTextBlock[])).toBe('1 min read');
  });

  it('extracts text from rich text blocks', () => {
    const body: TestRichTextBlock[] = [
      {
        content: [
          { type: 'text', text: 'Hello world' },
          { type: 'text', text: ' this is a test' }
        ]
      }
    ];
    expect(getStoryReadingTime(body)).toBe('1 min read');
  });

  it('filters out non-text content types', () => {
    const body: TestRichTextBlock[] = [
      {
        content: [
          { type: 'text', text: 'Hello' },
          { type: 'image', src: 'test.jpg' },
          { type: 'text', text: 'world' }
        ]
      }
    ];
    expect(getStoryReadingTime(body)).toBe('1 min read');
  });

  it('handles empty text content', () => {
    const body: TestRichTextBlock[] = [
      {
        content: [
          { type: 'text', text: '' },
          { type: 'text', text: null as unknown as string }
        ]
      }
    ];
    expect(getStoryReadingTime(body)).toBe('1 min read');
  });

  it('handles multiple blocks', () => {
    const body = [
      {
        content: [
          { type: 'text', text: 'First block text ' }
        ]
      },
      {
        content: [
          { type: 'text', text: 'Second block text' }
        ]
      }
    ];
    expect(getStoryReadingTime(body)).toBe('1 min read');
  });

  it('handles blocks without content array', () => {
    const body = [
      { type: 'heading', text: 'Simple block' }
    ];
    expect(getStoryReadingTime(body)).toBe('1 min read');
  });

  it('uses custom words per minute', () => {
    const body = [
      {
        content: Array.from({ length: 100 }, (_, i) => ({
          type: 'text',
          text: `word${i} `
        }))
      }
    ];
    expect(getStoryReadingTime(body, 50)).toBe('2 min read');
  });

  it('handles non-object blocks gracefully', () => {
    const body = ['string block', null, undefined];
    expect(getStoryReadingTime(body)).toBe('1 min read');
  });

  it('calculates reading time for substantial content', () => {
    const body = [
      {
        content: Array.from({ length: 250 }, (_, i) => ({
          type: 'text',
          text: `word${i} `
        }))
      }
    ];
    expect(getStoryReadingTime(body, 200)).toBe('2 min read');
  });

  it('handles mixed content types in rich text', () => {
    const body = [
      {
        content: [
          { type: 'text', text: 'Paragraph text with multiple words ' },
          { type: 'paragraph', children: [{ type: 'text', text: 'Nested text content' }] },
          { type: 'text', text: 'More text content ' }
        ]
      }
    ];
    expect(getStoryReadingTime(body)).toBe('1 min read');
  });
});

describe('formatDate', () => {
  it('returns empty string for invalid input', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(null as unknown as string)).toBe('');
    expect(formatDate(undefined as unknown as string)).toBe('');
  });

  it('formats valid ISO date string', () => {
    expect(formatDate('2025-01-15T10:00:00.000Z')).toBe('January 15, 2025');
  });

  it('formats date string without time', () => {
    expect(formatDate('2025-01-15')).toBe('January 15, 2025');
  });

  it('uses custom locale', () => {
    expect(formatDate('2025-01-15', 'es-ES')).toBe('15 de enero de 2025');
  });

  it('handles different date formats', () => {
    expect(formatDate('2025-12-06')).toBe('December 6, 2025');
    expect(formatDate('2024-02-29')).toBe('February 29, 2024'); // Leap year
  });

  it('handles edge cases of date parsing', () => {
    // Should handle invalid dates gracefully - Date constructor returns "Invalid Date" string
    expect(formatDate('invalid-date')).toBe('Invalid Date');
  });

  it('formats recent dates correctly', () => {
    const today = new Date();
    const dateString = today.toISOString();
    expect(formatDate(dateString)).toContain(today.getFullYear().toString());
    expect(formatDate(dateString)).toContain(today.toLocaleDateString('en-US', { month: 'long' }));
  });
});

describe('normalizeStoryblokUrl', () => {
  describe('Null/undefined handling', () => {
    it('returns "#" for null input', () => {
      expect(normalizeStoryblokUrl(null)).toBe('#');
    });

    it('returns "#" for undefined input', () => {
      expect(normalizeStoryblokUrl(undefined)).toBe('#');
    });

    it('returns "#" for empty string', () => {
      expect(normalizeStoryblokUrl('')).toBe('#');
    });
  });

  describe('Relative path normalization', () => {
    it('converts relative path to absolute path', () => {
      expect(normalizeStoryblokUrl('about')).toBe('/about');
    });

    it('converts nested relative path to absolute path', () => {
      expect(normalizeStoryblokUrl('insight-hub/category')).toBe('/insight-hub/category');
    });

    it('handles paths with query parameters', () => {
      expect(normalizeStoryblokUrl('about?ref=navbar')).toBe('/about?ref=navbar');
    });

    it('handles paths with hash fragments', () => {
      expect(normalizeStoryblokUrl('about#section')).toBe('/about#section');
    });
  });

  describe('Already absolute paths', () => {
    it('returns absolute path unchanged', () => {
      expect(normalizeStoryblokUrl('/about')).toBe('/about');
    });

    it('handles nested absolute paths', () => {
      expect(normalizeStoryblokUrl('/insight-hub/category')).toBe('/insight-hub/category');
    });

    it('handles absolute paths with query parameters', () => {
      expect(normalizeStoryblokUrl('/about?ref=navbar')).toBe('/about?ref=navbar');
    });

    it('handles absolute paths with hash fragments', () => {
      expect(normalizeStoryblokUrl('/about#section')).toBe('/about#section');
    });
  });

  describe('External URLs', () => {
    it('returns http URL unchanged', () => {
      expect(normalizeStoryblokUrl('http://example.com')).toBe('http://example.com');
    });

    it('returns https URL unchanged', () => {
      expect(normalizeStoryblokUrl('https://example.com')).toBe('https://example.com');
    });

    it('handles URLs with paths', () => {
      expect(normalizeStoryblokUrl('https://example.com/path/to/page')).toBe('https://example.com/path/to/page');
    });

    it('handles URLs with query parameters', () => {
      expect(normalizeStoryblokUrl('https://example.com?param=value')).toBe('https://example.com?param=value');
    });

    it('returns mailto links unchanged', () => {
      expect(normalizeStoryblokUrl('mailto:hello@example.com')).toBe('mailto:hello@example.com');
    });
  });

  describe('Special cases', () => {
    it('returns "#" unchanged for hash-only anchor', () => {
      expect(normalizeStoryblokUrl('#')).toBe('#');
    });

    it('handles home page path', () => {
      expect(normalizeStoryblokUrl('home')).toBe('/home');
    });

    it('handles root path', () => {
      expect(normalizeStoryblokUrl('/')).toBe('/');
    });
  });

  describe('Real-world Storyblok scenarios', () => {
    it('fixes navigation bug from /insight-hub/category to about page', () => {
      // This is the actual bug scenario reported by user
      expect(normalizeStoryblokUrl('about')).toBe('/about');
    });

    it('handles typical navigation items', () => {
      expect(normalizeStoryblokUrl('home')).toBe('/home');
      expect(normalizeStoryblokUrl('insight-hub')).toBe('/insight-hub');
      expect(normalizeStoryblokUrl('insight-hub/web-development')).toBe('/insight-hub/web-development');
    });

    it('handles Storyblok external links', () => {
      expect(normalizeStoryblokUrl('https://github.com/user')).toBe('https://github.com/user');
      expect(normalizeStoryblokUrl('mailto:contact@example.com')).toBe('mailto:contact@example.com');
    });
  });
});

describe('injectLazyLoading', () => {
  describe('Image tag handling', () => {
    it('adds loading="lazy" to img tags without loading attribute', () => {
      const html = '<img src="test.jpg" alt="test" />';
      expect(injectLazyLoading(html)).toBe('<img loading="lazy" src="test.jpg" alt="test" />');
    });

    it('does not double-add loading attribute if already present', () => {
      const html = '<img loading="eager" src="test.jpg" alt="test" />';
      expect(injectLazyLoading(html)).toBe('<img loading="eager" src="test.jpg" alt="test" />');
    });

    it('handles multiple img tags', () => {
      const html = '<img src="1.jpg" /><img src="2.jpg" /><img src="3.jpg" />';
      const result = injectLazyLoading(html);
      expect(result).toContain('<img loading="lazy" src="1.jpg" />');
      expect(result).toContain('<img loading="lazy" src="2.jpg" />');
      expect(result).toContain('<img loading="lazy" src="3.jpg" />');
    });

    it('preserves existing img attributes when adding loading', () => {
      const html = '<img class="responsive" src="image.jpg" alt="descriptive" width="800" />';
      const result = injectLazyLoading(html);
      expect(result).toContain('loading="lazy"');
      expect(result).toContain('class="responsive"');
      expect(result).toContain('src="image.jpg"');
      expect(result).toContain('alt="descriptive"');
      expect(result).toContain('width="800"');
    });

    it('handles case-insensitive img tags', () => {
      const html = '<IMG src="test.jpg" /><Img src="test2.jpg" />';
      const result = injectLazyLoading(html);
      // Note: The regex replacement normalizes to lowercase tags
      expect(result).toContain('<img loading="lazy"');
      expect(result.includes('loading="lazy"')).toBe(true);
    });
  });

  describe('Iframe tag handling', () => {
    it('adds loading="lazy" to iframe tags without loading attribute', () => {
      const html = '<iframe src="https://example.com" title="test"></iframe>';
      expect(injectLazyLoading(html)).toBe('<iframe loading="lazy" src="https://example.com" title="test"></iframe>');
    });

    it('does not double-add loading attribute to iframes if already present', () => {
      const html = '<iframe loading="eager" src="https://example.com"></iframe>';
      expect(injectLazyLoading(html)).toBe('<iframe loading="eager" src="https://example.com"></iframe>');
    });

    it('handles multiple iframe tags', () => {
      const html = '<iframe src="1.html"></iframe><iframe src="2.html"></iframe>';
      const result = injectLazyLoading(html);
      expect(result).toContain('<iframe loading="lazy" src="1.html"></iframe>');
      expect(result).toContain('<iframe loading="lazy" src="2.html"></iframe>');
    });

    it('preserves iframe attributes', () => {
      const html = '<iframe class="embedded" src="video.html" width="560" height="315"></iframe>';
      const result = injectLazyLoading(html);
      expect(result).toContain('loading="lazy"');
      expect(result).toContain('class="embedded"');
      expect(result).toContain('width="560"');
      expect(result).toContain('height="315"');
    });

    it('handles case-insensitive iframe tags', () => {
      const html = '<IFRAME src="test.html"></IFRAME><IFrame src="test2.html"></IFrame>';
      const result = injectLazyLoading(html);
      // Note: The regex replacement normalizes to lowercase tags
      expect(result).toContain('<iframe loading="lazy"');
      expect(result.includes('loading="lazy"')).toBe(true);
    });
  });

  describe('Video tag handling', () => {
    it('adds preload="none" to video tags without preload attribute', () => {
      const html = '<video src="video.mp4"></video>';
      expect(injectLazyLoading(html)).toBe('<video preload="none" src="video.mp4"></video>');
    });

    it('does not double-add preload attribute if already present', () => {
      const html = '<video preload="auto" src="video.mp4"></video>';
      expect(injectLazyLoading(html)).toBe('<video preload="auto" src="video.mp4"></video>');
    });

    it('handles multiple video tags', () => {
      const html = '<video src="1.mp4"></video><video src="2.mp4"></video>';
      const result = injectLazyLoading(html);
      expect(result).toContain('<video preload="none" src="1.mp4"></video>');
      expect(result).toContain('<video preload="none" src="2.mp4"></video>');
    });

    it('preserves video attributes', () => {
      const html = '<video class="video-player" width="640" height="480" controls></video>';
      const result = injectLazyLoading(html);
      expect(result).toContain('preload="none"');
      expect(result).toContain('class="video-player"');
      expect(result).toContain('width="640"');
      expect(result).toContain('controls');
    });

    it('handles case-insensitive video tags', () => {
      const html = '<VIDEO src="test.mp4"></VIDEO><Video src="test2.mp4"></Video>';
      const result = injectLazyLoading(html);
      // Note: The regex replacement normalizes to lowercase tags
      expect(result).toContain('<video preload="none"');
      expect(result.includes('preload="none"')).toBe(true);
    });

    it('handles video tags with child source elements', () => {
      const html = '<video><source src="video.mp4" type="video/mp4"></source></video>';
      const result = injectLazyLoading(html);
      expect(result).toContain('<video preload="none"');
      expect(result).toContain('<source src="video.mp4"');
    });
  });

  describe('Mixed content', () => {
    it('handles HTML with all media types together', () => {
      const html = `
        <p>Some text</p>
        <img src="image.jpg" alt="test" />
        <iframe src="embed.html"></iframe>
        <video src="video.mp4"></video>
        <p>More text</p>
      `;
      const result = injectLazyLoading(html);
      expect(result).toContain('<img loading="lazy"');
      expect(result).toContain('<iframe loading="lazy"');
      expect(result).toContain('<video preload="none"');
    });

    it('preserves non-media tags unchanged', () => {
      const html = '<div><p>Test paragraph</p><span>span content</span></div>';
      const result = injectLazyLoading(html);
      expect(result).toBe(html);
    });

    it('handles complex HTML structure', () => {
      const html = `
        <article>
          <h1>Title</h1>
          <figure>
            <img src="featured.jpg" alt="featured" />
            <figcaption>Image caption</figcaption>
          </figure>
          <section>
            <p>Content with <img src="inline.jpg" /> inline image</p>
          </section>
        </article>
      `;
      const result = injectLazyLoading(html);
      expect(result).toContain('<img loading="lazy" src="featured.jpg"');
      expect(result).toContain('<img loading="lazy" src="inline.jpg"');
    });
  });

  describe('Edge cases', () => {
    it('handles empty string', () => {
      expect(injectLazyLoading('')).toBe('');
    });

    it('handles string with no media tags', () => {
      const html = '<div><p>Just text</p></div>';
      expect(injectLazyLoading(html)).toBe(html);
    });

    it('handles malformed HTML gracefully', () => {
      const html = '<img src="test.jpg" <iframe src="test.html">';
      const result = injectLazyLoading(html);
      expect(result).toContain('loading="lazy"');
    });

    it('handles self-closing vs non-self-closing tags', () => {
      const html1 = '<img src="test.jpg" />';
      const html2 = '<img src="test.jpg">';
      expect(injectLazyLoading(html1)).toContain('loading="lazy"');
      expect(injectLazyLoading(html2)).toContain('loading="lazy"');
    });

    it('handles attributes with special characters', () => {
      const html = '<img src="test.jpg" alt="Test & special chars" data-info="a|b" />';
      const result = injectLazyLoading(html);
      expect(result).toContain('loading="lazy"');
      expect(result).toContain('alt="Test & special chars"');
      expect(result).toContain('data-info="a|b"');
    });

    it('handles attributes with quotes inside values', () => {
      const html = '<img src="test.jpg" alt=\'Image with "quotes"\' />';
      const result = injectLazyLoading(html);
      expect(result).toContain('loading="lazy"');
    });

    it('handles very long HTML strings', () => {
      const images = Array.from({ length: 100 }, (_, i) => `<img src="image-${i}.jpg" />`).join('\n');
      const result = injectLazyLoading(images);
      const matches = result.match(/loading="lazy"/g);
      expect(matches?.length).toBe(100);
    });

    it('handles tags with multiple spaces before tag name', () => {
      const html = '<img  src="test.jpg" />';
      const result = injectLazyLoading(html);
      expect(result).toContain('loading="lazy"');
    });

    it('does not modify src attribute values', () => {
      const html = '<img src="loading.jpg" />';
      const result = injectLazyLoading(html);
      expect(result).toContain('src="loading.jpg"');
    });
  });

  describe('Performance', () => {
    it('handles large documents with many media elements efficiently', () => {
      const largeHtml = Array.from({ length: 1000 }, () =>
        '<img src="test.jpg" /><iframe src="test.html"></iframe><video src="test.mp4"></video>'
      ).join('\n');

      const start = performance.now();
      const result = injectLazyLoading(largeHtml);
      const end = performance.now();

      expect(result).toContain('loading="lazy"');
      expect(result).toContain('preload="none"');
      expect(end - start).toBeLessThan(100); // Should complete quickly
    });
  });
});

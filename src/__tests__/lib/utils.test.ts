import { describe, it, expect } from 'vitest';
import { cn, getReadingTime, getStoryReadingTime, formatDate, normalizeStoryblokUrl } from '@/lib/utils';

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

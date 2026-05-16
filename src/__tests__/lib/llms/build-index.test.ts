import { describe, it, expect } from 'vitest';
import { buildLlmsIndex, type LlmsPost } from '@/lib/llms/build-index';

const base: LlmsPost = {
  title: 'Hello',
  slug: 'hello',
  description: 'A post about hello.',
  publishedAt: '2024-06-01T00:00:00.000Z',
};

describe('buildLlmsIndex', () => {
  it('starts with site name as h1 and blockquoted description', () => {
    const out = buildLlmsIndex({
      siteName: 'Notes of Dev',
      siteUrl: 'https://example.com',
      description: 'A blog',
      posts: [],
    });

    expect(out.split('\n')[0]).toBe('# Notes of Dev');
    expect(out).toContain('> A blog');
  });

  it('lists posts sorted by publishedAt desc with markdown links', () => {
    const out = buildLlmsIndex({
      siteName: 'Notes',
      siteUrl: 'https://example.com',
      description: '',
      posts: [
        { ...base, slug: 'older', publishedAt: '2024-01-01T00:00:00.000Z' },
        { ...base, slug: 'newer', publishedAt: '2024-12-01T00:00:00.000Z' },
      ],
    });

    const newerIdx = out.indexOf('](https://example.com/newer)');
    const olderIdx = out.indexOf('](https://example.com/older)');
    expect(newerIdx).toBeGreaterThan(-1);
    expect(olderIdx).toBeGreaterThan(-1);
    expect(newerIdx).toBeLessThan(olderIdx);
  });

  it('appends description with colon when present', () => {
    const out = buildLlmsIndex({
      siteName: 'Notes',
      siteUrl: 'https://example.com',
      description: '',
      posts: [base],
    });

    expect(out).toContain('- [Hello](https://example.com/hello): A post about hello.');
  });

  it('omits description tail when blank', () => {
    const out = buildLlmsIndex({
      siteName: 'Notes',
      siteUrl: 'https://example.com',
      description: '',
      posts: [{ ...base, description: '   ' }],
    });

    expect(out).toContain('- [Hello](https://example.com/hello)\n');
    expect(out).not.toContain('hello):');
  });

  it('strips HTML entities in title and description', () => {
    const out = buildLlmsIndex({
      siteName: 'Notes',
      siteUrl: 'https://example.com',
      description: '',
      posts: [{ ...base, title: 'Don&#39;t', description: 'a&nbsp;b' }],
    });

    expect(out).toContain("- [Don't](https://example.com/hello): a b");
  });

  it('truncates long descriptions with ellipsis', () => {
    const long = 'x'.repeat(500);
    const out = buildLlmsIndex({
      siteName: 'Notes',
      siteUrl: 'https://example.com',
      description: '',
      posts: [{ ...base, description: long }],
    });

    expect(out).toContain('…');
  });

  it('renders empty-posts placeholder', () => {
    const out = buildLlmsIndex({
      siteName: 'Notes',
      siteUrl: 'https://example.com',
      description: '',
      posts: [],
    });

    expect(out).toContain('_No posts yet._');
  });

  it('appends About section when aboutUrl present', () => {
    const out = buildLlmsIndex({
      siteName: 'Notes',
      siteUrl: 'https://example.com',
      description: '',
      posts: [],
      aboutUrl: 'https://example.com/about',
    });

    expect(out).toContain('## About');
    expect(out).toContain('[About the author](https://example.com/about)');
  });
});

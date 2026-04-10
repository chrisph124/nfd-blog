import { describe, it, expect } from 'vitest';
import { buildWebSiteJsonLd, buildBlogPostingJsonLd } from '@/lib/seo-structured-data';

describe('buildWebSiteJsonLd', () => {
  it('returns valid WebSite schema', () => {
    const result = buildWebSiteJsonLd({
      siteUrl: 'https://example.com',
      siteName: 'My Blog',
    });

    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'My Blog',
      url: 'https://example.com',
    });
  });
});

describe('buildBlogPostingJsonLd', () => {
  const baseParams = {
    siteUrl: 'https://example.com',
    slug: 'my-post',
    title: 'Test Post',
    description: 'A test post',
    datePublished: '2024-01-15',
    authorName: 'John Doe',
  };

  it('returns valid BlogPosting schema without image', () => {
    const result = buildBlogPostingJsonLd(baseParams);

    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Test Post',
      description: 'A test post',
      url: 'https://example.com/my-post',
      datePublished: '2024-01-15',
      author: { '@type': 'Person', name: 'John Doe' },
    });
  });

  it('includes image when provided', () => {
    const result = buildBlogPostingJsonLd({
      ...baseParams,
      imageUrl: 'https://example.com/image.jpg',
    });

    expect(result).toHaveProperty('image', 'https://example.com/image.jpg');
  });

  it('omits image field when imageUrl is undefined', () => {
    const result = buildBlogPostingJsonLd(baseParams);

    expect(result).not.toHaveProperty('image');
  });
});

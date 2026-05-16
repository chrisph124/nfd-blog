import { describe, it, expect } from 'vitest';
import {
  buildWebSiteJsonLd,
  buildBlogPostingJsonLd,
  buildOrganizationJsonLd,
  buildPersonJsonLd,
  estimateWordCount,
} from '@/lib/seo-structured-data';

describe('buildWebSiteJsonLd', () => {
  it('returns minimal WebSite schema', () => {
    expect(
      buildWebSiteJsonLd({ siteUrl: 'https://example.com', siteName: 'My Blog' })
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'My Blog',
      url: 'https://example.com',
    });
  });

  it('adds description when provided', () => {
    expect(
      buildWebSiteJsonLd({
        siteUrl: 'https://example.com',
        siteName: 'My Blog',
        description: 'A site',
      })
    ).toHaveProperty('description', 'A site');
  });
});

describe('buildBlogPostingJsonLd', () => {
  const baseParams = {
    siteUrl: 'https://example.com',
    slug: 'my-post',
    title: 'Test Post',
    description: 'A test post',
    datePublished: '2024-01-15T00:00:00Z',
    authorName: 'John Doe',
  };

  it('returns full BlogPosting schema with mainEntityOfPage + publisher', () => {
    const result = buildBlogPostingJsonLd(baseParams);

    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('BlogPosting');
    expect(result.headline).toBe('Test Post');
    expect(result.url).toBe('https://example.com/my-post');
    expect(result.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://example.com/my-post',
    });
    expect(result.author).toEqual({ '@type': 'Person', name: 'John Doe' });
    expect(result.publisher).toMatchObject({
      '@type': 'Organization',
      name: 'Notes of Dev',
      logo: { '@type': 'ImageObject', url: 'https://example.com/og-default.jpg' },
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

  it('includes dateModified when provided', () => {
    const result = buildBlogPostingJsonLd({
      ...baseParams,
      dateModified: '2024-02-01T00:00:00Z',
    });
    expect(result).toHaveProperty('dateModified', '2024-02-01T00:00:00Z');
  });

  it('includes wordCount only when positive', () => {
    expect(buildBlogPostingJsonLd({ ...baseParams, wordCount: 500 })).toHaveProperty(
      'wordCount',
      500
    );
    expect(buildBlogPostingJsonLd({ ...baseParams, wordCount: 0 })).not.toHaveProperty(
      'wordCount'
    );
  });

  it('includes author.url when authorUrl provided', () => {
    const result = buildBlogPostingJsonLd({
      ...baseParams,
      authorUrl: 'https://example.com/about',
    });
    expect(result.author).toMatchObject({
      '@type': 'Person',
      name: 'John Doe',
      url: 'https://example.com/about',
    });
  });
});

describe('buildOrganizationJsonLd', () => {
  it('returns Organization schema with default logo', () => {
    const result = buildOrganizationJsonLd({ siteUrl: 'https://example.com' });
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Notes of Dev',
      url: 'https://example.com',
      logo: { '@type': 'ImageObject', url: 'https://example.com/og-default.jpg' },
    });
  });

  it('uses custom logo when provided', () => {
    const result = buildOrganizationJsonLd({
      siteUrl: 'https://example.com',
      logoUrl: 'https://example.com/logo.png',
    });
    expect(result.logo).toEqual({
      '@type': 'ImageObject',
      url: 'https://example.com/logo.png',
    });
  });
});

describe('buildPersonJsonLd', () => {
  it('returns Person schema with sameAs', () => {
    const result = buildPersonJsonLd({
      siteUrl: 'https://example.com',
      name: 'Chris Pham',
      sameAs: ['https://github.com/chrisph124'],
    });
    expect(result).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Chris Pham',
      url: 'https://example.com/about',
      sameAs: ['https://github.com/chrisph124'],
    });
  });

  it('omits sameAs when empty', () => {
    const result = buildPersonJsonLd({
      siteUrl: 'https://example.com',
      name: 'Chris Pham',
      sameAs: [],
    });
    expect(result).not.toHaveProperty('sameAs');
  });
});

describe('estimateWordCount', () => {
  it('counts words from plain text', () => {
    expect(estimateWordCount('one two three four')).toBe(4);
  });

  it('returns 0 for empty/null/undefined', () => {
    expect(estimateWordCount('')).toBe(0);
    expect(estimateWordCount(null)).toBe(0);
    expect(estimateWordCount(undefined)).toBe(0);
  });

  it('collapses whitespace', () => {
    expect(estimateWordCount('  a   b\n\nc  ')).toBe(3);
  });
});

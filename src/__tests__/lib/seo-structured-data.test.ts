import { describe, it, expect } from 'vitest';
import {
  buildWebSiteJsonLd,
  buildBlogPostingJsonLd,
  buildOrganizationJsonLd,
  buildPersonJsonLd,
  buildHomeJsonLdGraph,
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

  it('includes sameAs when non-empty array provided', () => {
    const result = buildOrganizationJsonLd({
      siteUrl: 'https://example.com',
      sameAs: ['https://github.com/chrisph124', 'https://linkedin.com/in/chrispham124'],
    });
    expect(result).toHaveProperty('sameAs', [
      'https://github.com/chrisph124',
      'https://linkedin.com/in/chrispham124',
    ]);
  });

  it('omits sameAs when empty array provided', () => {
    const result = buildOrganizationJsonLd({
      siteUrl: 'https://example.com',
      sameAs: [],
    });
    expect(result).not.toHaveProperty('sameAs');
  });

  it('omits sameAs when undefined', () => {
    const result = buildOrganizationJsonLd({ siteUrl: 'https://example.com' });
    expect(result).not.toHaveProperty('sameAs');
  });
});

describe('buildHomeJsonLdGraph', () => {
  it('returns @graph with WebSite + Organization nodes', () => {
    const result = buildHomeJsonLdGraph({
      siteUrl: 'https://example.com',
      siteName: 'Notes of Dev',
      description: 'A site',
      sameAs: ['https://github.com/chrisph124'],
    });

    expect(result['@context']).toBe('https://schema.org');
    expect(Array.isArray(result['@graph'])).toBe(true);
    expect(result['@graph']).toHaveLength(2);

    const [website, organization] = result['@graph'];
    expect(website).toMatchObject({
      '@type': 'WebSite',
      name: 'Notes of Dev',
      url: 'https://example.com',
      description: 'A site',
    });
    expect(organization).toMatchObject({
      '@type': 'Organization',
      name: 'Notes of Dev',
      url: 'https://example.com',
      sameAs: ['https://github.com/chrisph124'],
    });
  });

  it('strips nested @context from inner nodes', () => {
    const result = buildHomeJsonLdGraph({
      siteUrl: 'https://example.com',
      siteName: 'Notes of Dev',
    });

    for (const node of result['@graph']) {
      expect(node).not.toHaveProperty('@context');
    }
  });

  it('omits sameAs on Organization when not provided', () => {
    const result = buildHomeJsonLdGraph({
      siteUrl: 'https://example.com',
      siteName: 'Notes of Dev',
    });

    const organization = result['@graph'].find((n) => (n as { '@type': string })['@type'] === 'Organization');
    expect(organization).not.toHaveProperty('sameAs');
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

describe('buildPersonJsonLd — extended', () => {
  it('includes jobTitle when provided', () => {
    const result = buildPersonJsonLd({
      siteUrl: 'https://example.com',
      name: 'Chris Pham',
      sameAs: [],
      jobTitle: 'Frontend Engineer',
    });
    expect(result).toHaveProperty('jobTitle', 'Frontend Engineer');
  });

  it('includes imageUrl when provided', () => {
    const result = buildPersonJsonLd({
      siteUrl: 'https://example.com',
      name: 'Chris Pham',
      sameAs: [],
      imageUrl: 'https://example.com/avatar.jpg',
    });
    expect(result).toHaveProperty('image', 'https://example.com/avatar.jpg');
  });
});

describe('buildBlogPostingJsonLd — extended', () => {
  const baseParams = {
    siteUrl: 'https://example.com',
    slug: 'my-post',
    title: 'Test Post',
    description: 'A test post',
    datePublished: '2024-01-15T00:00:00Z',
    authorName: 'John Doe',
  };

  it('uses explicit organizationLogoUrl when provided', () => {
    const result = buildBlogPostingJsonLd({
      ...baseParams,
      organizationLogoUrl: 'https://example.com/custom-logo.png',
    });
    expect(result.publisher.logo).toMatchObject({
      '@type': 'ImageObject',
      url: 'https://example.com/custom-logo.png',
    });
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

  it('returns 0 when text is all whitespace (covers line 131 !cleaned branch)', () => {
    expect(estimateWordCount('   ')).toBe(0);
    expect(estimateWordCount('\n\n\t')).toBe(0);
  });
});

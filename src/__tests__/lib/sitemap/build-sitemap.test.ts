import { describe, it, expect } from 'vitest';
import { buildSitemap, type SitemapEntry } from '@/lib/sitemap/build-sitemap';

describe('buildSitemap', () => {
  it('produces well-formed urlset with image namespace', () => {
    const xml = buildSitemap({
      entries: [{ loc: 'https://example.com' }],
    });

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(xml).toContain('<loc>https://example.com</loc>');
  });

  it('emits lastmod only for entries with a valid date, never a generation-time stand-in', () => {
    const xml = buildSitemap({
      entries: [
        { loc: 'https://example.com/a', lastmod: '2024-06-15T10:00:00.000Z' },
        { loc: 'https://example.com/b' },
        { loc: 'https://example.com/c', lastmod: 'garbage' },
      ],
    });

    expect(xml.match(/<lastmod>/g)).toHaveLength(1);
    expect(xml).toContain('<loc>https://example.com/a</loc>\n    <lastmod>2024-06-15T10:00:00.000Z</lastmod>');
  });

  it('renders changefreq when provided', () => {
    const xml = buildSitemap({
      entries: [{ loc: 'https://example.com', changefreq: 'monthly' }],
    });

    expect(xml).toContain('<changefreq>monthly</changefreq>');
  });

  it('omits changefreq when not provided', () => {
    const xml = buildSitemap({
      entries: [{ loc: 'https://example.com' }],
    });

    expect(xml).not.toContain('<changefreq>');
  });

  it('emits image:image entries for entries with images', () => {
    const entries: SitemapEntry[] = [
      {
        loc: 'https://example.com/post',
        images: [{ loc: 'https://cdn.example.com/img.jpg', title: 'Hero' }],
      },
    ];
    const xml = buildSitemap({ entries });

    expect(xml).toContain('<image:image>');
    expect(xml).toContain('<image:loc>https://cdn.example.com/img.jpg</image:loc>');
    expect(xml).toContain('<image:title>Hero</image:title>');
  });

  it('escapes XML special chars in loc and image title', () => {
    const xml = buildSitemap({
      entries: [
        {
          loc: 'https://example.com/?q=a&b=c',
          images: [{ loc: 'https://cdn.example.com/img.jpg', title: 'a & b' }],
        },
      ],
    });

    expect(xml).toContain('https://example.com/?q=a&amp;b=c');
    expect(xml).toContain('<image:title>a &amp; b</image:title>');
  });

  it('handles empty entries list', () => {
    const xml = buildSitemap({ entries: [] });
    expect(xml).toContain('<urlset');
    expect(xml).toContain('</urlset>');
    expect(xml).not.toContain('<url>');
  });

  it('emits image caption when provided', () => {
    const xml = buildSitemap({
      entries: [
        {
          loc: 'https://example.com/post',
          images: [{ loc: 'https://cdn.example.com/img.jpg', caption: 'A nice photo' }],
        },
      ],
    });

    expect(xml).toContain('<image:caption>A nice photo</image:caption>');
  });

  it('escapes all XML special chars: <, >, ", \' in loc and title', () => {
    const xml = buildSitemap({
      entries: [
        {
          loc: "https://example.com/<path>?a=\"b\"&c='d'",
          images: [{ loc: 'https://cdn.example.com/img.jpg', title: "<title> with \"quotes\" & 'apostrophes'" }],
        },
      ],
    });

    expect(xml).toContain('&lt;path&gt;');
    expect(xml).toContain('&quot;b&quot;');
    expect(xml).toContain('&apos;d&apos;');
    expect(xml).toContain('&lt;title&gt;');
    expect(xml).toContain('&quot;quotes&quot;');
    expect(xml).toContain("&apos;apostrophes&apos;");
  });
});

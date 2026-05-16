import { describe, it, expect } from 'vitest';
import { buildRssFeed, type FeedItem } from '@/lib/rss/build-feed';

const basePost: FeedItem = {
  title: 'Hello world',
  slug: 'hello-world',
  description: 'My first post.',
  publishedAt: '2024-06-01T00:00:00.000Z',
  modifiedAt: '2024-06-02T00:00:00.000Z',
};

describe('buildRssFeed', () => {
  it('produces well-formed RSS 2.0 with channel metadata', () => {
    const xml = buildRssFeed({
      siteUrl: 'https://example.com',
      siteName: 'Notes',
      siteDescription: 'A blog',
      posts: [basePost],
      generatedAt: new Date('2024-06-05T00:00:00.000Z'),
    });

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<title>Notes</title>');
    expect(xml).toContain('<link>https://example.com</link>');
    expect(xml).toContain('<description>A blog</description>');
    expect(xml).toContain('<atom:link href="https://example.com/rss.xml" rel="self"');
    expect(xml).toContain('<lastBuildDate>');
  });

  it('renders one <item> per post sorted by publishedAt desc', () => {
    const xml = buildRssFeed({
      siteUrl: 'https://example.com',
      siteName: 'Notes',
      siteDescription: 'A blog',
      posts: [
        { ...basePost, slug: 'older', publishedAt: '2024-01-01T00:00:00.000Z' },
        { ...basePost, slug: 'newer', publishedAt: '2024-12-01T00:00:00.000Z' },
      ],
    });

    const newerIdx = xml.indexOf('https://example.com/newer');
    const olderIdx = xml.indexOf('https://example.com/older');
    expect(newerIdx).toBeGreaterThan(-1);
    expect(olderIdx).toBeGreaterThan(-1);
    expect(newerIdx).toBeLessThan(olderIdx);
  });

  it('escapes XML special chars in title/description', () => {
    const xml = buildRssFeed({
      siteUrl: 'https://example.com',
      siteName: 'Notes',
      siteDescription: 'A & B',
      posts: [{ ...basePost, title: 'a < b & "quoted"', description: "it's <bad>" }],
    });

    expect(xml).toContain('a &lt; b &amp; &quot;quoted&quot;');
    expect(xml).toContain('it&apos;s &lt;bad&gt;');
    expect(xml).toContain('<description>A &amp; B</description>');
  });

  it('strips HTML entities from descriptions and titles', () => {
    const xml = buildRssFeed({
      siteUrl: 'https://example.com',
      siteName: 'Notes',
      siteDescription: '',
      posts: [{ ...basePost, title: 'Don&#39;t panic', description: 'foo&nbsp;bar' }],
    });

    expect(xml).toContain("Don&apos;t panic");
    expect(xml).toContain('foo bar');
  });

  it('emits enclosure with detected MIME for hero image', () => {
    const xml = buildRssFeed({
      siteUrl: 'https://example.com',
      siteName: 'Notes',
      siteDescription: '',
      posts: [{ ...basePost, heroUrl: 'https://cdn.example.com/img.png' }],
    });

    expect(xml).toContain('<enclosure url="https://cdn.example.com/img.png" type="image/png"');
  });

  it('emits category entries per tag', () => {
    const xml = buildRssFeed({
      siteUrl: 'https://example.com',
      siteName: 'Notes',
      siteDescription: '',
      posts: [{ ...basePost, tags: ['react', 'ai'] }],
    });

    expect(xml).toContain('<category>react</category>');
    expect(xml).toContain('<category>ai</category>');
  });

  it('truncates very long descriptions', () => {
    const long = 'x'.repeat(2000);
    const xml = buildRssFeed({
      siteUrl: 'https://example.com',
      siteName: 'Notes',
      siteDescription: '',
      posts: [{ ...basePost, description: long }],
    });

    expect(xml).toContain('…');
    expect(xml.length).toBeLessThan(2500);
  });

  it('includes author when authorEmail + authorName supplied', () => {
    const xml = buildRssFeed({
      siteUrl: 'https://example.com',
      siteName: 'Notes',
      siteDescription: '',
      authorName: 'Chris',
      authorEmail: 'a@b.com',
      posts: [basePost],
    });

    expect(xml).toContain('<author>a@b.com (Chris)</author>');
  });

  it('handles empty posts list with lastBuildDate fallback', () => {
    const xml = buildRssFeed({
      siteUrl: 'https://example.com',
      siteName: 'Notes',
      siteDescription: '',
      posts: [],
      generatedAt: new Date('2024-12-01T00:00:00.000Z'),
    });

    expect(xml).toContain('<lastBuildDate>Sun, 01 Dec 2024 00:00:00 GMT</lastBuildDate>');
    expect(xml).not.toContain('<item>');
  });

  it('falls back to generatedAt when publishedAt is invalid', () => {
    const fallback = new Date('2024-12-25T00:00:00.000Z');
    const xml = buildRssFeed({
      siteUrl: 'https://example.com',
      siteName: 'Notes',
      siteDescription: '',
      generatedAt: fallback,
      posts: [{ ...basePost, publishedAt: 'not-a-date' }],
    });

    expect(xml).toContain('<pubDate>Wed, 25 Dec 2024 00:00:00 GMT</pubDate>');
  });
});

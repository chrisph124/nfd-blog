import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StoryblokLinksResponse, StoryblokStoryLink } from '@/types/storyblok';

const mockGet = vi.fn();

vi.mock('@/lib/storyblok', () => ({
  getStoryblokApi: vi.fn(() => ({ get: mockGet })),
  getSiteUrl: vi.fn(() => 'https://example.com'),
}));

vi.mock('@/lib/storyblok-version', () => ({
  storyblokVersion: 'draft',
}));

import sitemap from '@/app/sitemap';

const createLink = (overrides: Partial<StoryblokStoryLink> = {}): StoryblokStoryLink => ({
  id: 1,
  slug: 'test-page',
  name: 'Test Page',
  is_folder: false,
  parent_id: null,
  published: true,
  published_at: '2024-06-01T00:00:00.000Z',
  position: 0,
  ...overrides,
});

describe('sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes static homepage entry', async () => {
    mockGet.mockResolvedValue({ data: { links: {} } });

    const result = await sitemap();

    expect(result[0]).toMatchObject({
      url: 'https://example.com',
      changeFrequency: 'daily',
      priority: 1,
    });
  });

  it('includes dynamic pages from Storyblok links', async () => {
    const links: StoryblokLinksResponse = {
      links: {
        '1': createLink({ id: 1, slug: 'about' }),
        '2': createLink({ id: 2, slug: 'posts/hello-world' }),
      },
    };
    mockGet.mockResolvedValue({ data: links });

    const result = await sitemap();

    const urls = result.map((entry) => entry.url);
    expect(urls).toContain('https://example.com/about');
    expect(urls).toContain('https://example.com/hello-world');
  });

  it('strips posts/ prefix from slugs', async () => {
    const links: StoryblokLinksResponse = {
      links: {
        '1': createLink({ slug: 'posts/my-article' }),
      },
    };
    mockGet.mockResolvedValue({ data: links });

    const result = await sitemap();

    expect(result.find((e) => e.url === 'https://example.com/my-article')).toBeDefined();
  });

  it('excludes folders', async () => {
    const links: StoryblokLinksResponse = {
      links: {
        '1': createLink({ slug: 'posts', is_folder: true }),
        '2': createLink({ slug: 'about' }),
      },
    };
    mockGet.mockResolvedValue({ data: links });

    const result = await sitemap();

    const urls = result.map((e) => e.url);
    expect(urls).not.toContain('https://example.com/posts');
    expect(urls).toContain('https://example.com/about');
  });

  it('excludes home slug', async () => {
    const links: StoryblokLinksResponse = {
      links: {
        '1': createLink({ slug: 'home' }),
        '2': createLink({ slug: 'contact' }),
      },
    };
    mockGet.mockResolvedValue({ data: links });

    const result = await sitemap();

    const urls = result.map((e) => e.url);
    expect(urls).not.toContain('https://example.com/home');
    expect(urls).toContain('https://example.com/contact');
  });

  it('excludes global/ slugs', async () => {
    const links: StoryblokLinksResponse = {
      links: {
        '1': createLink({ slug: 'global/header' }),
        '2': createLink({ slug: 'blog' }),
      },
    };
    mockGet.mockResolvedValue({ data: links });

    const result = await sitemap();

    const urls = result.map((e) => e.url);
    expect(urls).not.toContain('https://example.com/global/header');
    expect(urls).toContain('https://example.com/blog');
  });

  it('uses current date when published_at is null', async () => {
    const links: StoryblokLinksResponse = {
      links: {
        '1': createLink({ slug: 'draft-page', published_at: null }),
      },
    };
    mockGet.mockResolvedValue({ data: links });

    const result = await sitemap();
    const entry = result.find((e) => e.url === 'https://example.com/draft-page');

    expect(entry?.lastModified).toBeInstanceOf(Date);
  });

  it('returns only static pages on API error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGet.mockRejectedValue(new Error('API failure'));

    const result = await sitemap();

    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://example.com');
    consoleSpy.mockRestore();
  });
});

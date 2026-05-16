import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StoryblokLinksResponse, StoryblokStoryLink, StoryblokStory, PostBlok } from '@/types/storyblok';

const mockGet = vi.fn();
const mockFetchAllPosts = vi.fn();

vi.mock('@/lib/storyblok', () => ({
  getStoryblokApi: () => ({ get: mockGet }),
  fetchAllPosts: () => mockFetchAllPosts(),
  getSiteUrl: () => 'https://example.com',
  storyblokVersion: 'published',
}));

import { GET } from '@/app/sitemap.xml/route';

const link = (overrides: Partial<StoryblokStoryLink> = {}): StoryblokStoryLink => ({
  id: 1,
  uuid: 'u-1',
  slug: 'about',
  name: 'About',
  is_folder: false,
  parent_id: null,
  published: true,
  published_at: '2024-06-01T00:00:00.000Z',
  position: 0,
  is_startpage: false,
  ...overrides,
});

const post = (overrides?: Partial<StoryblokStory<PostBlok>>): StoryblokStory<PostBlok> => ({
  id: 99,
  uuid: 'u-99',
  name: 'Hello',
  slug: 'hello',
  full_slug: 'posts/hello',
  created_at: '2024-05-01T00:00:00.000Z',
  published_at: '2024-06-01T00:00:00.000Z',
  first_published_at: '2024-05-15T00:00:00.000Z',
  content: {
    _uid: 'p-uid',
    component: 'post',
    title: 'Hello title',
    featured_image: { id: 1, filename: 'https://cdn.example.com/hero.jpg', alt: 'hero' },
    body: [],
  },
  position: 0,
  tag_list: [],
  is_startpage: false,
  parent_id: null,
  meta_data: null,
  group_id: 'g',
  release_id: null,
  lang: 'en',
  path: '/posts/hello',
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
  ...overrides,
});

describe('GET /sitemap.xml', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns application/xml with cache headers and homepage entry', async () => {
    mockGet.mockResolvedValue({ data: { links: {} } as StoryblokLinksResponse });
    mockFetchAllPosts.mockResolvedValue([]);

    const response = await GET();
    const body = await response.text();

    expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=3600');
    expect(body).toContain('<loc>https://example.com</loc>');
  });

  it('emits dynamic page entries with stripped posts/ prefix and monthly cadence', async () => {
    mockGet.mockResolvedValue({
      data: {
        links: {
          '1': link({ slug: 'about' }),
          '2': link({ id: 2, slug: 'posts/hello', name: 'Hello' }),
        },
      } as StoryblokLinksResponse,
    });
    mockFetchAllPosts.mockResolvedValue([]);

    const body = await (await GET()).text();

    expect(body).toContain('<loc>https://example.com/about</loc>');
    expect(body).toContain('<loc>https://example.com/hello</loc>');
    expect(body).toContain('<changefreq>monthly</changefreq>');
  });

  it('excludes folders, home, and global/ slugs', async () => {
    mockGet.mockResolvedValue({
      data: {
        links: {
          '1': link({ slug: 'home' }),
          '2': link({ slug: 'global/header' }),
          '3': link({ slug: 'docs', is_folder: true }),
          '4': link({ slug: 'about' }),
        },
      } as StoryblokLinksResponse,
    });
    mockFetchAllPosts.mockResolvedValue([]);

    const body = await (await GET()).text();

    expect(body).toContain('https://example.com/about');
    expect(body).not.toContain('https://example.com/home');
    expect(body).not.toContain('https://example.com/global/header');
    expect(body).not.toContain('https://example.com/docs<');
  });

  it('attaches image:image entries when post has featured_image', async () => {
    mockGet.mockResolvedValue({
      data: {
        links: { '1': link({ id: 1, slug: 'posts/hello' }) },
      } as StoryblokLinksResponse,
    });
    mockFetchAllPosts.mockResolvedValue([post()]);

    const body = await (await GET()).text();

    expect(body).toContain('<image:image>');
    expect(body).toContain('<image:loc>https://cdn.example.com/hero.jpg</image:loc>');
    expect(body).toContain('<image:title>Hello title</image:title>');
  });

  it('emits lastmod from published_at', async () => {
    mockGet.mockResolvedValue({
      data: {
        links: { '1': link({ slug: 'about', published_at: '2024-07-04T12:00:00.000Z' }) },
      } as StoryblokLinksResponse,
    });
    mockFetchAllPosts.mockResolvedValue([]);

    const body = await (await GET()).text();
    expect(body).toContain('<lastmod>2024-07-04T12:00:00.000Z</lastmod>');
  });

  it('excludes draft links with null published_at', async () => {
    mockGet.mockResolvedValue({
      data: {
        links: {
          '1': link({ slug: 'about' }),
          '2': link({ id: 2, slug: 'draft-page', published_at: null }),
        },
      } as StoryblokLinksResponse,
    });
    mockFetchAllPosts.mockResolvedValue([]);

    const body = await (await GET()).text();

    expect(body).toContain('https://example.com/about');
    expect(body).not.toContain('https://example.com/draft-page');
  });

  it('returns only homepage entry on API error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGet.mockRejectedValue(new Error('boom'));
    mockFetchAllPosts.mockResolvedValue([]);

    const body = await (await GET()).text();
    const urlCount = (body.match(/<url>/g) ?? []).length;

    expect(urlCount).toBe(1);
    expect(body).toContain('<loc>https://example.com</loc>');
    consoleSpy.mockRestore();
  });
});

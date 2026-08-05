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

  it('uses story.name as image title when post has image but no content.title (line 34 || branch)', async () => {
    mockGet.mockResolvedValue({
      data: {
        links: { '1': link({ id: 1, slug: 'posts/no-title' }) },
      } as StoryblokLinksResponse,
    });
    mockFetchAllPosts.mockResolvedValue([
      post({
        name: 'Fallback Story Name',
        full_slug: 'posts/no-title',
        content: {
          _uid: 'p-uid',
          component: 'post',
          title: undefined as unknown as string,
          featured_image: { id: 2, filename: 'https://cdn.example.com/img.jpg', alt: 'img' },
          body: [],
        },
      }),
    ]);

    const body = await (await GET()).text();
    expect(body).toContain('<image:title>Fallback Story Name</image:title>');
  });

  it('emits the /tags hub plus one entry per archived tag', async () => {
    mockGet.mockResolvedValue({ data: { links: {} } as StoryblokLinksResponse });
    mockFetchAllPosts.mockResolvedValue([
      post({ uuid: 'u-1', full_slug: 'posts/a', tag_list: ['AI', 'Solo'], published_at: '2024-08-01T00:00:00.000Z' }),
      post({ uuid: 'u-2', full_slug: 'posts/b', tag_list: ['AI'], published_at: '2024-07-01T00:00:00.000Z' }),
    ]);

    const body = await (await GET()).text();

    expect(body).toContain('<loc>https://example.com/tags</loc>');
    // THRESHOLD=1 → every tag on any post is archived: AI (2 posts) and Solo (1).
    expect(body).toContain('<loc>https://example.com/tags/ai</loc>');
    expect(body).toContain('<loc>https://example.com/tags/solo</loc>');
    // lastmod tracks the newest (first-in-membership) post carrying the tag.
    expect(body).toContain('<loc>https://example.com/tags/ai</loc>\n    <lastmod>2024-08-01T00:00:00.000Z</lastmod>');
    expect(body).toContain('<loc>https://example.com/tags/solo</loc>\n    <lastmod>2024-08-01T00:00:00.000Z</lastmod>');
  });

  it('falls back to first_published_at for a tag lastmod when published_at is null', async () => {
    mockGet.mockResolvedValue({ data: { links: {} } as StoryblokLinksResponse });
    mockFetchAllPosts.mockResolvedValue([
      post({ uuid: 'u-1', full_slug: 'posts/a', tag_list: ['AI'], published_at: null, first_published_at: '2024-03-03T00:00:00.000Z' }),
      post({ uuid: 'u-2', full_slug: 'posts/b', tag_list: ['AI'], published_at: null, first_published_at: '2024-02-02T00:00:00.000Z' }),
    ]);

    const body = await (await GET()).text();

    expect(body).toContain('<loc>https://example.com/tags/ai</loc>\n    <lastmod>2024-03-03T00:00:00.000Z</lastmod>');
  });

  it('still emits a tag entry when the newest post carries neither date', async () => {
    mockGet.mockResolvedValue({ data: { links: {} } as StoryblokLinksResponse });
    mockFetchAllPosts.mockResolvedValue([
      post({ uuid: 'u-1', full_slug: 'posts/a', tag_list: ['AI'], published_at: null, first_published_at: null }),
      post({ uuid: 'u-2', full_slug: 'posts/b', tag_list: ['AI'], published_at: null, first_published_at: null }),
    ]);

    const body = await (await GET()).text();

    expect(body).toContain('<loc>https://example.com/tags/ai</loc>');
  });

  it('fetches posts exactly once — tag entries reuse the same census (RT#12)', async () => {
    mockGet.mockResolvedValue({ data: { links: {} } as StoryblokLinksResponse });
    mockFetchAllPosts.mockResolvedValue([
      post({ uuid: 'u-1', full_slug: 'posts/a', tag_list: ['AI'] }),
      post({ uuid: 'u-2', full_slug: 'posts/b', tag_list: ['AI'] }),
    ]);

    await GET();

    expect(mockFetchAllPosts).toHaveBeenCalledTimes(1);
  });

  it('still emits the /tags hub with no children when there are no archived tags', async () => {
    mockGet.mockResolvedValue({ data: { links: {} } as StoryblokLinksResponse });
    mockFetchAllPosts.mockResolvedValue([]);

    const body = await (await GET()).text();

    expect(body).toContain('<loc>https://example.com/tags</loc>');
    expect(body).not.toContain('https://example.com/tags/');
  });

  it('omits image entry when post has no featured_image', async () => {
    mockGet.mockResolvedValue({
      data: {
        links: { '1': link({ id: 1, slug: 'posts/no-image' }) },
      } as StoryblokLinksResponse,
    });
    mockFetchAllPosts.mockResolvedValue([
      post({
        full_slug: 'posts/no-image',
        content: {
          _uid: 'p-uid',
          component: 'post',
          title: 'No image post',
          featured_image: undefined,
          body: [],
        },
      }),
    ]);

    const body = await (await GET()).text();
    expect(body).not.toContain('<image:image>');
    expect(body).toContain('<loc>https://example.com/no-image</loc>');
  });
});

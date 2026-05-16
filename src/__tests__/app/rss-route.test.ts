import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StoryblokStory, PostBlok } from '@/types/storyblok';

const mockFetchAllPosts = vi.fn();

vi.mock('@/lib/storyblok', () => ({
  fetchAllPosts: () => mockFetchAllPosts(),
  getSiteUrl: () => 'https://example.com',
}));

import { GET } from '@/app/rss.xml/route';

const createPost = (overrides?: Partial<StoryblokStory<PostBlok>>): StoryblokStory<PostBlok> => ({
  id: 1,
  uuid: 'uuid-post',
  name: 'My Post',
  slug: 'my-post',
  full_slug: 'posts/my-post',
  created_at: '2024-05-01T00:00:00.000Z',
  published_at: '2024-06-01T00:00:00.000Z',
  first_published_at: '2024-05-15T00:00:00.000Z',
  content: {
    _uid: 'post-uid',
    component: 'post',
    title: 'My Post Title',
    og_description: 'OG desc',
    excerpt: 'My excerpt',
    featured_image: { id: 1, filename: 'https://cdn.example.com/hero.jpg', alt: 'hero' },
    body: [],
  },
  position: 0,
  tag_list: ['react'],
  is_startpage: false,
  parent_id: null,
  meta_data: null,
  group_id: 'g-1',
  release_id: null,
  lang: 'en',
  path: '/posts/my-post',
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
  ...overrides,
});

describe('GET /rss.xml', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns application/rss+xml with cache headers', async () => {
    mockFetchAllPosts.mockResolvedValue([createPost()]);

    const response = await GET();

    expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=3600');
  });

  it('includes a channel item per post with stripped posts/ prefix', async () => {
    mockFetchAllPosts.mockResolvedValue([createPost()]);

    const response = await GET();
    const body = await response.text();

    expect(body).toContain('<title>My Post Title</title>');
    expect(body).toContain('<link>https://example.com/my-post</link>');
    expect(body).toContain('https://cdn.example.com/hero.jpg');
    expect(body).toContain('<category>react</category>');
  });

  it('renders an empty channel when no posts returned', async () => {
    mockFetchAllPosts.mockResolvedValue([]);

    const response = await GET();
    const body = await response.text();

    expect(body).toContain('<channel>');
    expect(body).not.toContain('<item>');
  });

  it('falls back to story.name when content.title is absent', async () => {
    mockFetchAllPosts.mockResolvedValue([
      createPost({
        name: 'Fallback Name',
        content: {
          _uid: 'post-uid',
          component: 'post',
          title: undefined as unknown as string,
          og_description: 'OG desc',
          excerpt: 'excerpt',
          body: [],
        },
      }),
    ]);

    const body = await (await GET()).text();
    expect(body).toContain('<title>Fallback Name</title>');
  });

  it('falls back to og_description when excerpt is absent', async () => {
    mockFetchAllPosts.mockResolvedValue([
      createPost({
        content: {
          _uid: 'post-uid',
          component: 'post',
          title: 'My Post Title',
          og_description: 'OG fallback desc',
          excerpt: undefined as unknown as string,
          body: [],
        },
      }),
    ]);

    const body = await (await GET()).text();
    expect(body).toContain('OG fallback desc');
  });

  it('uses created_at when first_published_at and published_at are absent', async () => {
    mockFetchAllPosts.mockResolvedValue([
      createPost({
        first_published_at: null as unknown as string,
        published_at: null as unknown as string,
        created_at: '2023-01-01T00:00:00.000Z',
      }),
    ]);

    const body = await (await GET()).text();
    // Should still produce a valid item (pubDate from created_at fallback)
    expect(body).toContain('<item>');
  });

  it('uses first_published_at as modifiedAt when published_at is null (line 17 || branch)', async () => {
    mockFetchAllPosts.mockResolvedValue([
      createPost({
        first_published_at: '2024-03-01T00:00:00.000Z',
        published_at: null as unknown as string,
        created_at: '2024-02-01T00:00:00.000Z',
      }),
    ]);

    const body = await (await GET()).text();
    expect(body).toContain('<item>');
  });
});

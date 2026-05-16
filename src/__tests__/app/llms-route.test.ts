import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StoryblokStory, PostBlok } from '@/types/storyblok';

const mockFetchAllPosts = vi.fn();

vi.mock('@/lib/storyblok', () => ({
  fetchAllPosts: () => mockFetchAllPosts(),
  getSiteUrl: () => 'https://example.com',
}));

import { GET } from '@/app/llms.txt/route';

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
    excerpt: 'A short excerpt',
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
  path: '/posts/my-post',
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
  ...overrides,
});

describe('GET /llms.txt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns text/plain markdown with cache header', async () => {
    mockFetchAllPosts.mockResolvedValue([]);

    const response = await GET();

    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=3600');
  });

  it('emits posts list with stripped slug prefix', async () => {
    mockFetchAllPosts.mockResolvedValue([createPost()]);

    const body = await (await GET()).text();

    expect(body).toContain('# Notes of Dev');
    expect(body).toContain('- [My Post Title](https://example.com/my-post): A short excerpt');
    expect(body).toContain('## About');
  });

  it('filters out posts with no publish timestamp', async () => {
    mockFetchAllPosts.mockResolvedValue([
      createPost({ slug: 'draft', full_slug: 'posts/draft', first_published_at: null, published_at: null }),
      createPost({ slug: 'live', full_slug: 'posts/live' }),
    ]);

    const body = await (await GET()).text();

    expect(body).toContain('https://example.com/live');
    expect(body).not.toContain('https://example.com/draft');
  });

  it('falls back to story.name when content.title is absent', async () => {
    mockFetchAllPosts.mockResolvedValue([
      createPost({
        name: 'Story Name Fallback',
        content: {
          _uid: 'post-uid',
          component: 'post',
          title: undefined as unknown as string,
          excerpt: 'a description',
          body: [],
        },
      }),
    ]);

    const body = await (await GET()).text();
    expect(body).toContain('[Story Name Fallback]');
  });

  it('falls back to og_description when excerpt is absent', async () => {
    mockFetchAllPosts.mockResolvedValue([
      createPost({
        content: {
          _uid: 'post-uid',
          component: 'post',
          title: 'My Post Title',
          og_description: 'OG fallback',
          excerpt: undefined as unknown as string,
          body: [],
        },
      }),
    ]);

    const body = await (await GET()).text();
    expect(body).toContain('OG fallback');
  });

  it('uses empty string description when both excerpt and og_description are absent', async () => {
    mockFetchAllPosts.mockResolvedValue([
      createPost({
        content: {
          _uid: 'post-uid',
          component: 'post',
          title: 'No Desc Post',
          excerpt: undefined as unknown as string,
          og_description: undefined as unknown as string,
          body: [],
        },
      }),
    ]);

    const body = await (await GET()).text();
    // Post should appear but without a colon-separated description
    expect(body).toContain('[No Desc Post]');
  });
});

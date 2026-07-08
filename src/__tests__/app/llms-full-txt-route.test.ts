import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PostBlok, StoryblokStory } from '@/types/storyblok';

const mockFetchAllPosts = vi.fn();

vi.mock('@/lib/storyblok', () => ({
  fetchAllPosts: () => mockFetchAllPosts(),
  getSiteUrl: () => 'https://example.com',
}));

import { GET } from '@/app/llms-full.txt/route';

const createPost = (n: number, overrides?: Partial<StoryblokStory<PostBlok>>): StoryblokStory<PostBlok> => ({
  id: n,
  uuid: `uuid-${n}`,
  name: `Post ${n}`,
  slug: `post-${n}`,
  full_slug: `posts/post-${n}`,
  created_at: '2024-01-01T00:00:00.000Z',
  published_at: '2024-06-01T00:00:00.000Z',
  first_published_at: '2024-05-01T00:00:00.000Z',
  content: {
    _uid: `post-${n}`,
    component: 'post',
    title: `Post ${n}`,
    excerpt: `Excerpt ${n}`,
    body: [{ _uid: `r-${n}`, component: 'markdown', content: `Body ${n}.` }],
  },
  position: 0,
  tag_list: [],
  is_startpage: false,
  parent_id: null,
  meta_data: null,
  group_id: 'g',
  release_id: null,
  lang: 'en',
  path: `/posts/post-${n}`,
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
  ...overrides,
});

describe('GET /llms-full.txt', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns text/plain with a cache header', async () => {
    mockFetchAllPosts.mockResolvedValue([]);
    const response = await GET();
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=3600');
  });

  it('concatenates published posts separated by a divider', async () => {
    mockFetchAllPosts.mockResolvedValue([createPost(1), createPost(2)]);
    const body = await (await GET()).text();

    expect(body).toContain('# Post 1');
    expect(body).toContain('# Post 2');
    expect(body).toContain('\n---\n');
    expect(body).not.toContain('# [truncated');
  });

  it('filters out posts with no publish timestamp', async () => {
    mockFetchAllPosts.mockResolvedValue([
      createPost(1),
      createPost(2, { first_published_at: null, published_at: null }),
    ]);
    const body = await (await GET()).text();

    expect(body).toContain('# Post 1');
    expect(body).not.toContain('# Post 2');
  });

  it('caps output at 50 posts with a truncation footer (RT#12)', async () => {
    const posts = Array.from({ length: 51 }, (_, i) => createPost(i + 1));
    mockFetchAllPosts.mockResolvedValue(posts);
    const body = await (await GET()).text();

    expect(body).toContain('# [truncated — 1 older post(s) omitted; see each /{slug}.md]');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PostBlok, StoryblokStory } from '@/types/storyblok';

const mockFetchPublished = vi.fn();

vi.mock('@/lib/storyblok', () => ({
  fetchPublishedStoryBySlug: (slug: string) => mockFetchPublished(slug),
  getSiteUrl: () => 'https://example.com',
}));

import { GET } from '@/app/api/md/[slug]/route';

const createPost = (overrides?: Partial<StoryblokStory<PostBlok>>): StoryblokStory<PostBlok> => ({
  id: 1,
  uuid: 'uuid',
  name: 'My Post',
  slug: 'my-post',
  full_slug: 'posts/my-post',
  created_at: '2024-01-01T00:00:00.000Z',
  published_at: '2024-06-01T00:00:00.000Z',
  first_published_at: '2024-05-01T00:00:00.000Z',
  content: {
    _uid: 'post',
    component: 'post',
    title: 'My Post',
    excerpt: 'Excerpt',
    body: [
      {
        _uid: 'c',
        component: 'code_tabs',
        tabs: [
          { _uid: 't', component: 'code_tab', label: 'app.ts', language: 'ts', code: 'const x = 1;', filename: 'app.ts' },
        ],
      },
    ],
  },
  position: 0,
  tag_list: ['ts'],
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

const invoke = (slug: string) =>
  GET(new Request(`https://example.com/api/md/${slug}`), { params: Promise.resolve({ slug }) });

describe('GET /api/md/[slug]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('serves markdown with the right headers for a published post', async () => {
    mockFetchPublished.mockResolvedValue({ story: createPost(), source: 'posts' });

    const response = await invoke('my-post');
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    expect(response.headers.get('Link')).toBe('<https://example.com/my-post.md>; rel="canonical"');
    expect(body.startsWith('---\n')).toBe(true);
    expect(body).toContain('# My Post');
    expect(body).toContain('```ts title="app.ts"');
    expect(body).not.toContain('<script');
  });

  it('404s a non-post page (e.g. /about.md)', async () => {
    mockFetchPublished.mockResolvedValue({
      story: createPost({ content: { _uid: 'p', component: 'page' } as unknown as PostBlok }),
      source: 'pages',
    });

    const response = await invoke('about');
    expect(response.status).toBe(404);
  });

  it('404s an unpublished post (no publish timestamps)', async () => {
    mockFetchPublished.mockResolvedValue({
      story: createPost({ first_published_at: null, published_at: null }),
      source: 'posts',
    });

    const response = await invoke('draft');
    expect(response.status).toBe(404);
  });

  it('404s an unknown slug', async () => {
    mockFetchPublished.mockResolvedValue(null);
    const response = await invoke('nope');
    expect(response.status).toBe(404);
  });
});

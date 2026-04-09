import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StoryblokStory, PageBlok, PostBlok } from '@/types/storyblok';

const { mockApi, mockGet } = vi.hoisted(() => {
  const mockApi = {
    get: vi.fn<
      [string, { version: string }],
      Promise<{ data: { story: StoryblokStory } }>
    >(),
  };
  return { mockApi, mockGet: mockApi.get };
});

vi.mock('@storyblok/react/rsc', () => ({
  storyblokInit: vi.fn(() => () => mockApi),
  apiPlugin: {},
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  };
});

import { getSiteUrl, fetchHomeStory, fetchStoryBySlug, fetchStory } from '@/lib/storyblok';

const createMockPageStory = (slug = 'home'): StoryblokStory<PageBlok> => ({
  id: 1,
  uuid: 'uuid-page',
  name: 'Test Page',
  slug,
  full_slug: slug,
  created_at: '2024-01-01T00:00:00.000Z',
  published_at: '2024-01-01T00:00:00.000Z',
  first_published_at: '2024-01-01T00:00:00.000Z',
  content: {
    _uid: 'page-uid',
    component: 'page',
    og_title: 'Test Page Title',
    og_description: 'Test Page Description',
    body: [],
  },
  position: 0,
  tag_list: [],
  is_startpage: false,
  parent_id: null,
  meta_data: null,
  group_id: 'group-1',
  release_id: null,
  lang: 'en',
  path: `/${slug}`,
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
});

const createMockPostStory = (slug = 'test-post'): StoryblokStory<PostBlok> => ({
  id: 2,
  uuid: 'uuid-post',
  name: 'Test Post',
  slug,
  full_slug: `posts/${slug}`,
  created_at: '2024-01-01T00:00:00.000Z',
  published_at: '2024-01-01T00:00:00.000Z',
  first_published_at: '2024-01-01T00:00:00.000Z',
  content: {
    _uid: 'post-uid',
    component: 'post',
    title: 'Test Post Title',
    featured_image: {
      id: 1,
      filename: 'https://example.com/image.jpg',
      alt: 'Test image',
    },
    excerpt: 'Test excerpt',
    body: [],
  },
  position: 0,
  tag_list: [],
  is_startpage: false,
  parent_id: null,
  meta_data: null,
  group_id: 'group-2',
  release_id: null,
  lang: 'en',
  path: `/posts/${slug}`,
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
});

// ============================================================================
// getSiteUrl
// ============================================================================

describe('getSiteUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns NEXT_PUBLIC_SITE_URL with trailing slash stripped', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com/';
    expect(getSiteUrl()).toBe('https://example.com');
  });

  it('strips multiple trailing slashes', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com///';
    expect(getSiteUrl()).toBe('https://example.com');
  });

  it('returns URL unchanged when no trailing slash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    expect(getSiteUrl()).toBe('https://example.com');
  });

  it('falls back to VERCEL_URL with https prefix', () => {
    process.env.VERCEL_URL = 'my-app.vercel.app';
    expect(getSiteUrl()).toBe('https://my-app.vercel.app');
  });

  it('falls back to localhost when no env vars set', () => {
    expect(getSiteUrl()).toBe('http://localhost:3000');
  });
});

// ============================================================================
// fetchHomeStory
// ============================================================================

describe('fetchHomeStory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns story on success', async () => {
    const mockStory = createMockPageStory('home');
    mockGet.mockResolvedValue({ data: { story: mockStory } });

    const result = await fetchHomeStory();

    expect(result).toEqual(mockStory);
    expect(mockGet).toHaveBeenCalledWith('cdn/stories/home', { version: 'published' });
  });

  it('returns null on error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGet.mockRejectedValue(new Error('Network error'));

    const result = await fetchHomeStory();

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

// ============================================================================
// fetchStoryBySlug
// ============================================================================

describe('fetchStoryBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns post with source="posts" when found in posts/', async () => {
    const mockPost = createMockPostStory('my-post');
    mockGet.mockResolvedValue({ data: { story: mockPost } });

    const result = await fetchStoryBySlug('my-post');

    expect(result).toEqual({ story: mockPost, source: 'posts' });
    expect(mockGet).toHaveBeenCalledWith('cdn/stories/posts/my-post', { version: 'published' });
  });

  it('falls back to page with source="pages" when post not found', async () => {
    const mockPage = createMockPageStory('about');
    mockGet
      .mockRejectedValueOnce(new Error('Not found'))
      .mockResolvedValueOnce({ data: { story: mockPage } });

    const result = await fetchStoryBySlug('about');

    expect(result).toEqual({ story: mockPage, source: 'pages' });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('returns null when both post and page fail', async () => {
    mockGet
      .mockRejectedValueOnce(new Error('Not found'))
      .mockRejectedValueOnce(new Error('Not found'));

    const result = await fetchStoryBySlug('non-existent');

    expect(result).toBeNull();
  });
});

// ============================================================================
// fetchStory
// ============================================================================

describe('fetchStory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns story on success', async () => {
    const mockStory = createMockPageStory('about/team');
    mockGet.mockResolvedValue({ data: { story: mockStory } });

    const result = await fetchStory('about/team');

    expect(result).toEqual(mockStory);
    expect(mockGet).toHaveBeenCalledWith('cdn/stories/about/team', { version: 'published' });
  });

  it('returns null on error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGet.mockRejectedValue(new Error('Fetch failed'));

    const result = await fetchStory('bad-slug');

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

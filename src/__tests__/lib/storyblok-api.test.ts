import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StoryblokStory, PageBlok, PostBlok } from '@/types/storyblok';

// Use vi.hoisted to ensure mock is ready before module evaluation
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

import { fetchStoryApi, fetchStoryBySlugApi } from '@/lib/storyblok-api';

// Helper to create mock PageBlok story
const createMockPageStory = (slug: string = 'test-page'): StoryblokStory<PageBlok> => ({
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

// Helper to create mock PostBlok story
const createMockPostStory = (slug: string = 'test-post'): StoryblokStory<PostBlok> => ({
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

describe('fetchStoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns StoryblokStory when story is found', async () => {
    const mockPageStory = createMockPageStory('home');
    mockGet.mockResolvedValue({ data: { story: mockPageStory } });

    const result = await fetchStoryApi('home');

    expect(result).toEqual(mockPageStory);
    expect(mockGet).toHaveBeenCalledWith('cdn/stories/home', { version: 'draft' });
  });

  it('returns null when story not found (404)', async () => {
    mockGet.mockRejectedValue(new Error('Not found'));

    const result = await fetchStoryApi('non-existent');

    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const result = await fetchStoryApi('any-page');

    expect(result).toBeNull();
  });
});

describe('fetchStoryBySlugApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns PostBlok when post is found at /cdn/stories/posts/{slug}', async () => {
    const mockPostStory = createMockPostStory('my-post');
    mockGet.mockResolvedValue({ data: { story: mockPostStory } });

    const result = await fetchStoryBySlugApi('my-post');

    expect(result).toEqual(mockPostStory);
    expect(mockGet).toHaveBeenCalledWith('cdn/stories/posts/my-post', { version: 'draft' });
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('falls back to page when post 404s but page is found', async () => {
    const mockPageStory = createMockPageStory('about');
    mockGet
      .mockRejectedValueOnce(new Error('Not found'))
      .mockResolvedValueOnce({ data: { story: mockPageStory } });

    const result = await fetchStoryBySlugApi('about');

    expect(result).toEqual(mockPageStory);
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenNthCalledWith(1, 'cdn/stories/posts/about', { version: 'draft' });
    expect(mockGet).toHaveBeenNthCalledWith(2, 'cdn/stories/about', { version: 'draft' });
  });

  it('returns null when both post and page 404', async () => {
    mockGet
      .mockRejectedValueOnce(new Error('Not found'))
      .mockRejectedValueOnce(new Error('Not found'));

    const result = await fetchStoryBySlugApi('non-existent');

    expect(result).toBeNull();
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('falls back to page when post returns network error but page is found', async () => {
    const mockPageStory = createMockPageStory('contact');
    mockGet
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: { story: mockPageStory } });

    const result = await fetchStoryBySlugApi('contact');

    expect(result).toEqual(mockPageStory);
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('returns null when both post and page return network errors', async () => {
    mockGet
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchStoryBySlugApi('error-page');

    expect(result).toBeNull();
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});

describe('fetchStoryBySlugApi edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles empty slug string', async () => {
    const mockPageStory = createMockPageStory('');
    mockGet.mockResolvedValue({ data: { story: mockPageStory } });

    const result = await fetchStoryBySlugApi('');

    expect(mockGet).toHaveBeenCalledWith('cdn/stories/posts/', { version: 'draft' });
    expect(result).toEqual(mockPageStory);
  });

  it('handles slug with special characters', async () => {
    const mockPostStory = createMockPostStory('hello-world-2024');
    mockGet.mockResolvedValue({ data: { story: mockPostStory } });

    const result = await fetchStoryBySlugApi('hello-world-2024');

    expect(mockGet).toHaveBeenCalledWith('cdn/stories/posts/hello-world-2024', { version: 'draft' });
    expect(result).toEqual(mockPostStory);
  });

  it('handles story with missing optional fields', async () => {
    const mockPageStoryWithMissingFields: StoryblokStory<PageBlok> = {
      id: 3,
      uuid: 'uuid-partial',
      name: 'Partial Page',
      slug: 'partial',
      full_slug: 'partial',
      created_at: '2024-01-01T00:00:00.000Z',
      published_at: null,
      first_published_at: null,
      content: {
        _uid: 'partial-uid',
        component: 'page',
        body: [],
      },
      position: 0,
      tag_list: [],
      is_startpage: false,
      parent_id: null,
      meta_data: null,
      group_id: 'group-3',
      release_id: null,
      lang: 'en',
      path: '/partial',
      alternates: [],
      default_full_slug: null,
      translated_slugs: null,
    };

    mockGet.mockResolvedValue({ data: { story: mockPageStoryWithMissingFields } });

    const result = await fetchStoryApi('partial');

    expect(result).toEqual(mockPageStoryWithMissingFields);
    expect(result?.content.og_title).toBeUndefined();
    expect(result?.content.og_image).toBeUndefined();
  });
});

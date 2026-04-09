import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StoryblokStory, PageBlok, PostBlok } from '@/types/storyblok';

const mockFetchStoryApi = vi.fn<[string], Promise<StoryblokStory<PageBlok> | null>>();
const mockFetchStoryBySlugApi = vi.fn<[string], Promise<StoryblokStory<PostBlok> | null>>();

vi.mock('@/lib/storyblok-api', () => ({
  fetchStoryApi: (...args: [string]) => mockFetchStoryApi(...args),
  fetchStoryBySlugApi: (...args: [string]) => mockFetchStoryBySlugApi(...args),
}));

let capturedElement: unknown;
let capturedOptions: unknown;

vi.mock('next/og', () => ({
  ImageResponse: class MockImageResponse {
    constructor(element: unknown, options: unknown) {
      capturedElement = element;
      capturedOptions = options;
    }
  },
}));

import { GET } from '@/app/api/og/route';
import type { NextRequest } from 'next/server';

function createRequest(slug?: string): NextRequest {
  const url = new URL('http://localhost/api/og');
  if (slug) url.searchParams.set('slug', slug);
  return { nextUrl: url } as NextRequest;
}

const createMockPageStory = (overrides?: Partial<PageBlok>): StoryblokStory<PageBlok> => ({
  id: 1,
  uuid: 'uuid-page',
  name: 'Page Name',
  slug: 'home',
  full_slug: 'home',
  created_at: '2024-01-01T00:00:00.000Z',
  published_at: '2024-01-01T00:00:00.000Z',
  first_published_at: '2024-01-01T00:00:00.000Z',
  content: {
    _uid: 'page-uid',
    component: 'page',
    og_title: 'OG Title',
    og_description: 'OG Desc',
    body: [],
    ...overrides,
  },
  position: 0,
  tag_list: [],
  is_startpage: false,
  parent_id: null,
  meta_data: null,
  group_id: 'group-1',
  release_id: null,
  lang: 'en',
  path: '/home',
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
});

const createMockPostStory = (overrides?: Partial<PostBlok>): StoryblokStory<PostBlok> => ({
  id: 2,
  uuid: 'uuid-post',
  name: 'Post Name',
  slug: 'my-post',
  full_slug: 'posts/my-post',
  created_at: '2024-01-01T00:00:00.000Z',
  published_at: '2024-01-01T00:00:00.000Z',
  first_published_at: '2024-01-01T00:00:00.000Z',
  content: {
    _uid: 'post-uid',
    component: 'post',
    title: 'Post Title',
    excerpt: 'Excerpt',
    body: [],
    ...overrides,
  },
  position: 0,
  tag_list: [],
  is_startpage: false,
  parent_id: null,
  meta_data: null,
  group_id: 'group-2',
  release_id: null,
  lang: 'en',
  path: '/posts/my-post',
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
});

describe('OG Image Route - GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedElement = undefined;
    capturedOptions = undefined;
  });

  it('resolves home slug via fetchStoryApi', async () => {
    const story = createMockPageStory({ og_title: 'Home Title' });
    mockFetchStoryApi.mockResolvedValue(story);

    await GET(createRequest('home'));

    expect(mockFetchStoryApi).toHaveBeenCalledWith('home');
    expect(capturedOptions).toEqual(expect.objectContaining({ width: 1200, height: 630 }));
  });

  it('resolves post slug via fetchStoryBySlugApi', async () => {
    const story = createMockPostStory({ title: 'My Post' });
    mockFetchStoryBySlugApi.mockResolvedValue(story);

    await GET(createRequest('my-post'));

    expect(mockFetchStoryBySlugApi).toHaveBeenCalledWith('my-post');
    expect(capturedElement).toBeDefined();
  });

  it('falls back to fetchStoryApi for nested slugs when fetchStoryBySlugApi returns null', async () => {
    const story = createMockPageStory({ og_title: 'Nested Title' });
    mockFetchStoryBySlugApi.mockResolvedValue(null);
    mockFetchStoryApi.mockResolvedValue(story);

    await GET(createRequest('about/team'));

    expect(mockFetchStoryBySlugApi).toHaveBeenCalledWith('about/team');
    expect(mockFetchStoryApi).toHaveBeenCalledWith('about/team');
  });

  it('returns default title when no story found', async () => {
    mockFetchStoryBySlugApi.mockResolvedValue(null);
    mockFetchStoryApi.mockResolvedValue(null);

    await GET(createRequest('non-existent'));

    expect(capturedElement).toBeDefined();
  });

  it('renders image background when story has og_image', async () => {
    const story = createMockPageStory({
      og_title: 'With Image',
      og_image: { id: 1, filename: 'https://example.com/og.jpg', alt: 'OG' },
    });
    mockFetchStoryApi.mockResolvedValue(story);

    await GET(createRequest('home'));

    expect(capturedElement).toBeDefined();
  });

  it('renders text fallback when no image', async () => {
    const story = createMockPageStory({ og_title: 'No Image' });
    mockFetchStoryApi.mockResolvedValue(story);

    await GET(createRequest('home'));

    expect(capturedElement).toBeDefined();
  });

  it('defaults to home slug when no slug param', async () => {
    const story = createMockPageStory();
    mockFetchStoryApi.mockResolvedValue(story);

    await GET(createRequest());

    expect(mockFetchStoryApi).toHaveBeenCalledWith('home');
  });
});

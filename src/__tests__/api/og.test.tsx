import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StoryblokStory, PageBlok, PostBlok, StoryblokAsset } from '@/types/storyblok';

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

const DEFAULT_ORIGIN = 'https://notesof.dev';

function createRequest(slug?: string): NextRequest {
  const url = new URL(`${DEFAULT_ORIGIN}/api/og`);
  if (slug) url.searchParams.set('slug', slug);
  return { nextUrl: url, url: url.toString() } as NextRequest;
}

// Extracts the <img src> from the captured JSX tree.
// Root element shape: { type: 'div', props: { children: { type: 'img', props: { src, style } } } }
function getImageSrc(element: unknown): string | undefined {
  const root = element as { props?: { children?: unknown } } | undefined;
  const child = root?.props?.children as
    | { type?: string; props?: { src?: string } }
    | undefined;
  return child?.type === 'img' ? child.props?.src : undefined;
}

function getImageObjectFit(element: unknown): string | undefined {
  const root = element as { props?: { children?: unknown } } | undefined;
  const child = root?.props?.children as
    | { type?: string; props?: { style?: { objectFit?: string } } }
    | undefined;
  return child?.props?.style?.objectFit;
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

  it('falls back to default image when no story found', async () => {
    mockFetchStoryBySlugApi.mockResolvedValue(null);
    mockFetchStoryApi.mockResolvedValue(null);

    await GET(createRequest('non-existent'));

    expect(getImageSrc(capturedElement)).toBe(`${DEFAULT_ORIGIN}/og-default.jpg`);
    expect(getImageObjectFit(capturedElement)).toBe('contain');
  });

  it('uses og_image when set on page', async () => {
    const story = createMockPageStory({
      og_title: 'With Image',
      og_image: { id: 1, filename: 'https://example.com/og.jpg', alt: 'OG' },
    });
    mockFetchStoryApi.mockResolvedValue(story);

    await GET(createRequest('home'));

    expect(getImageSrc(capturedElement)).toBe('https://example.com/og.jpg');
    expect(getImageObjectFit(capturedElement)).toBe('cover');
  });

  it('defaults to home slug when no slug param', async () => {
    const story = createMockPageStory();
    mockFetchStoryApi.mockResolvedValue(story);

    await GET(createRequest());

    expect(mockFetchStoryApi).toHaveBeenCalledWith('home');
  });

  // Regression: Storyblok returns `{id: null, filename: '', ...}` (truthy) for empty asset
  // fields. A naive `||` on the asset object would short-circuit to the empty og_image and
  // never check featured_image. Must fall through based on `.filename`.
  it('falls through empty og_image object to featured_image (Storyblok bug)', async () => {
    const story = createMockPostStory({
      og_image: {
        id: null,
        filename: '',
        alt: '',
        name: '',
        focus: '',
        title: '',
      } as unknown as StoryblokAsset,
      featured_image: { id: 2, filename: 'https://a.storyblok.com/featured.jpg', alt: 'feat' },
    });
    mockFetchStoryBySlugApi.mockResolvedValue(story);

    await GET(createRequest('my-post'));

    expect(getImageSrc(capturedElement)).toBe('https://a.storyblok.com/featured.jpg');
    expect(getImageObjectFit(capturedElement)).toBe('cover');
  });

  it('uses featured_image when og_image not set on post', async () => {
    const story = createMockPostStory({
      featured_image: { id: 2, filename: 'https://a.storyblok.com/post.jpg', alt: 'p' },
    });
    mockFetchStoryBySlugApi.mockResolvedValue(story);

    await GET(createRequest('my-post'));

    expect(getImageSrc(capturedElement)).toBe('https://a.storyblok.com/post.jpg');
  });

  it('prefers og_image over featured_image when both set', async () => {
    const story = createMockPostStory({
      og_image: { id: 1, filename: 'https://a.storyblok.com/og.jpg', alt: 'og' },
      featured_image: { id: 2, filename: 'https://a.storyblok.com/feat.jpg', alt: 'f' },
    });
    mockFetchStoryBySlugApi.mockResolvedValue(story);

    await GET(createRequest('my-post'));

    expect(getImageSrc(capturedElement)).toBe('https://a.storyblok.com/og.jpg');
  });

  it('post with no images falls back to default image', async () => {
    const story = createMockPostStory();
    mockFetchStoryBySlugApi.mockResolvedValue(story);

    await GET(createRequest('my-post'));

    expect(getImageSrc(capturedElement)).toBe(`${DEFAULT_ORIGIN}/og-default.jpg`);
  });

  it('nested slug with og_image uses that image', async () => {
    const story = createMockPageStory({
      og_image: { id: 3, filename: 'https://a.storyblok.com/nested.jpg', alt: 'n' },
    });
    mockFetchStoryBySlugApi.mockResolvedValue(null);
    mockFetchStoryApi.mockResolvedValue(story);

    await GET(createRequest('about/team'));

    expect(getImageSrc(capturedElement)).toBe('https://a.storyblok.com/nested.jpg');
  });

  it('default image URL resolves against request origin', async () => {
    mockFetchStoryBySlugApi.mockResolvedValue(null);
    mockFetchStoryApi.mockResolvedValue(null);

    await GET(createRequest('missing'));

    expect(getImageSrc(capturedElement)).toBe(`${DEFAULT_ORIGIN}/og-default.jpg`);
  });
});

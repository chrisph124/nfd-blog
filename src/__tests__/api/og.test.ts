import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StoryblokStory, PageBlok, PostBlok, StoryblokAsset } from '@/types/storyblok';

const mockFetchStoryApi = vi.fn<[string], Promise<StoryblokStory<PageBlok> | null>>();
const mockFetchStoryBySlugApi = vi.fn<[string], Promise<StoryblokStory<PostBlok> | null>>();

vi.mock('@/lib/storyblok-api', () => ({
  fetchStoryApi: (...args: [string]) => mockFetchStoryApi(...args),
  fetchStoryBySlugApi: (...args: [string]) => mockFetchStoryBySlugApi(...args),
}));

import { GET, optimizeStoryblokAsset } from '@/app/api/og/route';
import type { NextRequest } from 'next/server';

const DEFAULT_ORIGIN = 'https://notesof.dev';

function createRequest(slug?: string): NextRequest {
  const url = new URL(`${DEFAULT_ORIGIN}/api/og`);
  if (slug) url.searchParams.set('slug', slug);
  return { nextUrl: url, url: url.toString() } as NextRequest;
}

async function getRedirect(slug?: string): Promise<{ location: string | null; status: number; cacheControl: string | null }> {
  const res = await GET(createRequest(slug));
  return {
    location: res.headers.get('Location'),
    status: res.status,
    cacheControl: res.headers.get('Cache-Control'),
  };
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
  });

  it('resolves home slug via fetchStoryApi', async () => {
    const story = createMockPageStory({ og_title: 'Home Title' });
    mockFetchStoryApi.mockResolvedValue(story);

    const { status } = await getRedirect('home');

    expect(mockFetchStoryApi).toHaveBeenCalledWith('home');
    expect(status).toBe(302);
  });

  it('resolves post slug via fetchStoryBySlugApi', async () => {
    const story = createMockPostStory({ title: 'My Post' });
    mockFetchStoryBySlugApi.mockResolvedValue(story);

    await getRedirect('my-post');

    expect(mockFetchStoryBySlugApi).toHaveBeenCalledWith('my-post');
  });

  it('falls back to fetchStoryApi for nested slugs when fetchStoryBySlugApi returns null', async () => {
    const story = createMockPageStory({ og_title: 'Nested Title' });
    mockFetchStoryBySlugApi.mockResolvedValue(null);
    mockFetchStoryApi.mockResolvedValue(story);

    await getRedirect('about/team');

    expect(mockFetchStoryBySlugApi).toHaveBeenCalledWith('about/team');
    expect(mockFetchStoryApi).toHaveBeenCalledWith('about/team');
  });

  it('falls back to default image when no story found', async () => {
    mockFetchStoryBySlugApi.mockResolvedValue(null);
    mockFetchStoryApi.mockResolvedValue(null);

    const { location } = await getRedirect('non-existent');

    expect(location).toBe(`${DEFAULT_ORIGIN}/og-default.jpg`);
  });

  it('uses og_image when set on page (non-storyblok URL passes through)', async () => {
    const story = createMockPageStory({
      og_title: 'With Image',
      og_image: { id: 1, filename: 'https://example.com/og.jpg', alt: 'OG' },
    });
    mockFetchStoryApi.mockResolvedValue(story);

    const { location } = await getRedirect('home');

    expect(location).toBe('https://example.com/og.jpg');
  });

  it('defaults to home slug when no slug param', async () => {
    const story = createMockPageStory();
    mockFetchStoryApi.mockResolvedValue(story);

    await getRedirect();

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

    const { location } = await getRedirect('my-post');

    expect(location).toBe(
      'https://a.storyblok.com/featured.jpg/m/1200x630/filters:quality(75):format(jpg)'
    );
  });

  it('uses featured_image when og_image not set on post', async () => {
    const story = createMockPostStory({
      featured_image: { id: 2, filename: 'https://a.storyblok.com/post.jpg', alt: 'p' },
    });
    mockFetchStoryBySlugApi.mockResolvedValue(story);

    const { location } = await getRedirect('my-post');

    expect(location).toBe(
      'https://a.storyblok.com/post.jpg/m/1200x630/filters:quality(75):format(jpg)'
    );
  });

  it('prefers og_image over featured_image when both set', async () => {
    const story = createMockPostStory({
      og_image: { id: 1, filename: 'https://a.storyblok.com/og.jpg', alt: 'og' },
      featured_image: { id: 2, filename: 'https://a.storyblok.com/feat.jpg', alt: 'f' },
    });
    mockFetchStoryBySlugApi.mockResolvedValue(story);

    const { location } = await getRedirect('my-post');

    expect(location).toBe(
      'https://a.storyblok.com/og.jpg/m/1200x630/filters:quality(75):format(jpg)'
    );
  });

  it('post with no images falls back to default image', async () => {
    const story = createMockPostStory();
    mockFetchStoryBySlugApi.mockResolvedValue(story);

    const { location } = await getRedirect('my-post');

    expect(location).toBe(`${DEFAULT_ORIGIN}/og-default.jpg`);
  });

  it('nested slug with og_image uses that image', async () => {
    const story = createMockPageStory({
      og_image: { id: 3, filename: 'https://a.storyblok.com/nested.jpg', alt: 'n' },
    });
    mockFetchStoryBySlugApi.mockResolvedValue(null);
    mockFetchStoryApi.mockResolvedValue(story);

    const { location } = await getRedirect('about/team');

    expect(location).toBe(
      'https://a.storyblok.com/nested.jpg/m/1200x630/filters:quality(75):format(jpg)'
    );
  });

  it('default image URL resolves against request origin', async () => {
    mockFetchStoryBySlugApi.mockResolvedValue(null);
    mockFetchStoryApi.mockResolvedValue(null);

    const { location } = await getRedirect('missing');

    expect(location).toBe(`${DEFAULT_ORIGIN}/og-default.jpg`);
  });

  it('falls back to home slug when slug param contains unsafe chars', async () => {
    const story = createMockPageStory();
    mockFetchStoryApi.mockResolvedValue(story);

    await getRedirect('<script>alert(1)</script>');

    expect(mockFetchStoryApi).toHaveBeenCalledWith('home');
  });

  it('falls back to home slug when slug param is excessively long', async () => {
    const story = createMockPageStory();
    mockFetchStoryApi.mockResolvedValue(story);

    await getRedirect('a'.repeat(500));

    expect(mockFetchStoryApi).toHaveBeenCalledWith('home');
  });

  it('accepts valid nested slug', async () => {
    const story = createMockPageStory();
    mockFetchStoryBySlugApi.mockResolvedValue(null);
    mockFetchStoryApi.mockResolvedValue(story);

    await getRedirect('docs/getting-started');

    expect(mockFetchStoryApi).toHaveBeenCalledWith('docs/getting-started');
  });

  it('emits long-lived cache header on redirect', async () => {
    const story = createMockPageStory();
    mockFetchStoryApi.mockResolvedValue(story);

    const { cacheControl } = await getRedirect('home');

    expect(cacheControl).toContain('s-maxage=604800');
    expect(cacheControl).toContain('stale-while-revalidate=86400');
  });

  it('returns 302 status code', async () => {
    mockFetchStoryApi.mockResolvedValue(null);
    mockFetchStoryBySlugApi.mockResolvedValue(null);

    const { status } = await getRedirect('whatever');

    expect(status).toBe(302);
  });
});

describe('optimizeStoryblokAsset', () => {
  it('appends transform path to a.storyblok.com URLs', () => {
    expect(optimizeStoryblokAsset('https://a.storyblok.com/hero.jpg')).toBe(
      'https://a.storyblok.com/hero.jpg/m/1200x630/filters:quality(75):format(jpg)'
    );
  });

  it('returns non-Storyblok URLs unchanged', () => {
    expect(optimizeStoryblokAsset('https://cdn.example.com/hero.jpg')).toBe(
      'https://cdn.example.com/hero.jpg'
    );
  });

  it('returns undefined for undefined input', () => {
    expect(optimizeStoryblokAsset(undefined)).toBeUndefined();
  });

  it('does not double-apply transform path when /m/ already present', () => {
    const already = 'https://a.storyblok.com/hero.jpg/m/800x800';
    expect(optimizeStoryblokAsset(already)).toBe(already);
  });
});

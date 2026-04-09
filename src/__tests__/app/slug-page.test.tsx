import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { StoryblokStory, PageBlok, PostBlok } from '@/types/storyblok';

const mockFetchStoryBySlug = vi.fn();
const mockGetSiteUrl = vi.fn<[], string>();
const mockGetStoryblokApi = vi.fn();
const mockNotFound = vi.fn();

vi.mock('@/lib/storyblok', () => ({
  fetchStoryBySlug: (...args: unknown[]) => mockFetchStoryBySlug(...args),
  getSiteUrl: () => mockGetSiteUrl(),
  getStoryblokApi: () => mockGetStoryblokApi(),
  storyblokVersion: 'published',
}));

vi.mock('@storyblok/react/rsc', () => ({
  StoryblokStory: ({ story }: { story: StoryblokStory }) => (
    <div data-testid="storyblok-story">{story.name}</div>
  ),
  storyblokInit: vi.fn(() => vi.fn()),
  apiPlugin: {},
}));

vi.mock('@/components/templates/Post', () => ({
  default: ({ blok }: { blok: PostBlok }) => (
    <div data-testid="post-template">{blok.title}</div>
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    mockNotFound();
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import DynamicPage, { generateMetadata, generateStaticParams } from '@/app/[slug]/page';

const createMockPageStory = (): StoryblokStory<PageBlok> => ({
  id: 1,
  uuid: 'uuid-page',
  name: 'About Page',
  slug: 'about',
  full_slug: 'about',
  created_at: '2024-01-01T00:00:00.000Z',
  published_at: '2024-01-01T00:00:00.000Z',
  first_published_at: '2024-01-01T00:00:00.000Z',
  content: {
    _uid: 'page-uid',
    component: 'page',
    og_title: 'About OG',
    og_description: 'About desc',
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
  path: '/about',
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
});

const createMockPostStory = (): StoryblokStory<PostBlok> => ({
  id: 2,
  uuid: 'uuid-post',
  name: 'My Post',
  slug: 'my-post',
  full_slug: 'posts/my-post',
  created_at: '2024-01-01T00:00:00.000Z',
  published_at: '2024-01-01T00:00:00.000Z',
  first_published_at: '2024-01-01T00:00:00.000Z',
  content: {
    _uid: 'post-uid',
    component: 'post',
    title: 'My Post Title',
    og_title: 'Post OG',
    og_description: 'Post desc',
    excerpt: 'Excerpt',
    featured_image: { id: 1, filename: 'https://example.com/img.jpg', alt: 'img' },
    body: [],
  },
  position: 0,
  tag_list: ['tech'],
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

const makeParams = (slug: string) => Promise.resolve({ slug });

describe('DynamicPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('renders Post template when source is posts', async () => {
    const story = createMockPostStory();
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'posts' });

    const Component = await DynamicPage({ params: makeParams('my-post') });
    render(Component);

    expect(screen.getByTestId('post-template')).toHaveTextContent('My Post Title');
  });

  it('renders StoryblokStory for regular pages', async () => {
    const story = createMockPageStory();
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'pages' });

    const Component = await DynamicPage({ params: makeParams('about') });
    render(Component);

    expect(screen.getByTestId('storyblok-story')).toHaveTextContent('About Page');
  });

  it('calls notFound when result is null', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetchStoryBySlug.mockResolvedValue(null);

    await expect(DynamicPage({ params: makeParams('missing') })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('generateMetadata ([slug])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('returns metadata from story content', async () => {
    const story = createMockPostStory();
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'posts' });

    const metadata = await generateMetadata({ params: makeParams('my-post') });

    expect(metadata.title).toBe('Post OG');
    expect(metadata.description).toBe('Post desc');
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://example.com/api/og?slug=my-post', width: 1200, height: 630 },
    ]);
  });

  it('returns empty object when not found', async () => {
    mockFetchStoryBySlug.mockResolvedValue(null);

    const metadata = await generateMetadata({ params: makeParams('missing') });

    expect(metadata).toEqual({});
  });
});

describe('generateStaticParams ([slug])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paths with posts/ prefix stripped', async () => {
    mockGetStoryblokApi.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        data: {
          links: {
            '1': { slug: 'posts/hello', is_folder: false },
            '2': { slug: 'about', is_folder: false },
            '3': { slug: 'global/header', is_folder: false },
            '4': { slug: 'home', is_folder: false },
            '5': { slug: 'blog', is_folder: true },
          },
        },
      }),
    });

    const params = await generateStaticParams();

    expect(params).toEqual([
      { slug: 'hello' },
      { slug: 'about' },
    ]);
  });

  it('returns empty array on error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetStoryblokApi.mockReturnValue({
      get: vi.fn().mockRejectedValue(new Error('API down')),
    });

    const params = await generateStaticParams();

    expect(params).toEqual([]);
    consoleSpy.mockRestore();
  });
});

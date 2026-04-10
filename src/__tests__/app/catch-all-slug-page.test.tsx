import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { StoryblokStory, PageBlok } from '@/types/storyblok';

const mockFetchStory = vi.fn();
const mockGetSiteUrl = vi.fn<[], string>();
const mockGetStoryblokApi = vi.fn();
const mockNotFound = vi.fn();

vi.mock('@/lib/storyblok', () => ({
  fetchStory: (...args: unknown[]) => mockFetchStory(...args),
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

vi.mock('next/navigation', () => ({
  notFound: () => {
    mockNotFound();
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import CatchAllPage, { generateMetadata, generateStaticParams } from '@/app/[...slug]/page';

const createMockStory = (slug = 'nested/page'): StoryblokStory<PageBlok> => ({
  id: 1,
  uuid: 'uuid-nested',
  name: 'Nested Page',
  slug,
  full_slug: slug,
  created_at: '2024-01-01T00:00:00.000Z',
  published_at: '2024-01-01T00:00:00.000Z',
  first_published_at: '2024-01-01T00:00:00.000Z',
  content: {
    _uid: 'page-uid',
    component: 'page',
    og_title: 'Nested OG Title',
    og_description: 'Nested OG description',
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

const makeParams = (slug: string[]) => Promise.resolve({ slug });

describe('CatchAllPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('renders StoryblokStory with joined slug', async () => {
    const story = createMockStory('docs/getting-started');
    mockFetchStory.mockResolvedValue(story);

    const Component = await CatchAllPage({ params: makeParams(['docs', 'getting-started']) });
    render(Component);

    expect(mockFetchStory).toHaveBeenCalledWith('docs/getting-started');
    expect(screen.getByTestId('storyblok-story')).toHaveTextContent('Nested Page');
  });

  it('calls notFound when story is null', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetchStory.mockResolvedValue(null);

    await expect(
      CatchAllPage({ params: makeParams(['missing', 'page']) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('generateMetadata ([...slug])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('returns metadata with joined slug', async () => {
    const story = createMockStory('docs/getting-started');
    mockFetchStory.mockResolvedValue(story);

    const metadata = await generateMetadata({ params: makeParams(['docs', 'getting-started']) });

    expect(metadata.title).toBe('Nested OG Title');
    expect(metadata.description).toBe('Nested OG description');
    expect(metadata.alternates?.canonical).toBe('/docs/getting-started');
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://example.com/api/og?slug=docs%2Fgetting-started', width: 1200, height: 630 },
    ]);
  });

  it('falls back to story name when og_title is empty', async () => {
    const story = createMockStory();
    story.content.og_title = '  ';
    mockFetchStory.mockResolvedValue(story);

    const metadata = await generateMetadata({ params: makeParams(['nested', 'page']) });

    expect(metadata.title).toBe('Nested Page');
  });

  it('returns empty object when story not found', async () => {
    mockFetchStory.mockResolvedValue(null);

    const metadata = await generateMetadata({ params: makeParams(['missing']) });

    expect(metadata).toEqual({});
  });
});

describe('generateStaticParams ([...slug])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns slug arrays split by /', async () => {
    mockGetStoryblokApi.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        data: {
          links: {
            '1': { slug: 'docs/intro', is_folder: false },
            '2': { slug: 'docs/guides/setup', is_folder: false },
          },
        },
      }),
    });

    const params = await generateStaticParams();

    expect(params).toEqual([
      { slug: ['docs', 'intro'] },
      { slug: ['docs', 'guides', 'setup'] },
    ]);
  });

  it('excludes folders, home, and global/ slugs', async () => {
    mockGetStoryblokApi.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        data: {
          links: {
            '1': { slug: 'docs/intro', is_folder: false },
            '2': { slug: 'docs', is_folder: true },
            '3': { slug: 'home', is_folder: false },
            '4': { slug: 'global/header', is_folder: false },
          },
        },
      }),
    });

    const params = await generateStaticParams();

    expect(params).toEqual([{ slug: ['docs', 'intro'] }]);
  });

  it('returns empty array on API error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetStoryblokApi.mockReturnValue({
      get: vi.fn().mockRejectedValue(new Error('API down')),
    });

    const params = await generateStaticParams();

    expect(params).toEqual([]);
    consoleSpy.mockRestore();
  });
});

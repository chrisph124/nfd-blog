import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { StoryblokStory, PageBlok } from '@/types/storyblok';

const mockFetchHomeStory = vi.fn<[], Promise<StoryblokStory<PageBlok> | null>>();
const mockGetSiteUrl = vi.fn<[], string>();
const mockNotFound = vi.fn();

vi.mock('@/lib/storyblok', () => ({
  fetchHomeStory: () => mockFetchHomeStory(),
  getSiteUrl: () => mockGetSiteUrl(),
  getStoryblokApi: vi.fn(),
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

import Home, { generateMetadata } from '@/app/page';

const createMockStory = (overrides?: Partial<PageBlok>): StoryblokStory<PageBlok> => ({
  id: 1,
  uuid: 'uuid-home',
  name: 'Home',
  slug: 'home',
  full_slug: 'home',
  created_at: '2024-01-01T00:00:00.000Z',
  published_at: '2024-01-01T00:00:00.000Z',
  first_published_at: '2024-01-01T00:00:00.000Z',
  content: {
    _uid: 'home-uid',
    component: 'page',
    og_title: 'Home OG Title',
    og_description: 'Home OG Desc',
    body: [],
    ...overrides,
  },
  position: 0,
  tag_list: [],
  is_startpage: true,
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

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('renders StoryblokStory when story exists', async () => {
    const story = createMockStory();
    mockFetchHomeStory.mockResolvedValue(story);

    const Component = await Home();
    render(Component);

    expect(screen.getByTestId('storyblok-story')).toHaveTextContent('Home');
  });

  it('calls notFound when story is null', async () => {
    mockFetchHomeStory.mockResolvedValue(null);

    await expect(Home()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalled();
  });
});

describe('Home generateMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('returns og fields from story', async () => {
    mockFetchHomeStory.mockResolvedValue(createMockStory());

    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Home OG Title');
    expect(metadata.description).toBe('Home OG Desc');
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://example.com/api/og?slug=home', width: 1200, height: 630 },
    ]);
  });

  it('returns fallback when no story', async () => {
    mockFetchHomeStory.mockResolvedValue(null);

    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Notes of Dev');
    expect(metadata.description).toBe('Blog of a developer');
  });
});

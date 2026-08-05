import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { StoryblokStory, PageBlok, PostBlok } from '@/types/storyblok';

const mockFetchStoryBySlug = vi.fn();
const mockGetSiteUrl = vi.fn<() => string>();
const mockGetStoryblokApi = vi.fn();
const mockNotFound = vi.fn();

vi.mock('@/lib/storyblok', () => ({
  fetchStoryBySlug: (...args: unknown[]) => mockFetchStoryBySlug(...args),
  getSiteUrl: () => mockGetSiteUrl(),
  getStoryblokApi: () => mockGetStoryblokApi(),
  // The post branch now reads the tag census (via getTagCensus → fetchAllPosts).
  // An empty result yields ok:false, so pills fail open to plain spans.
  fetchAllPosts: () => Promise.resolve([]),
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
      { url: 'https://example.com/api/og?slug=my-post', width: 1200, height: 630, alt: 'Post OG' },
    ]);
    expect(metadata.openGraph?.type).toBe('article');
    expect(metadata.openGraph?.url).toBe('https://example.com/my-post');
    expect(metadata.other).toMatchObject({
      'article:published_time': '2024-01-01T00:00:00.000Z',
      'article:modified_time': '2024-01-01T00:00:00.000Z',
      'article:author': 'Hieu (Chris) Pham',
      'article:tag': ['tech'],
    });
  });

  it('returns empty object when not found', async () => {
    mockFetchStoryBySlug.mockResolvedValue(null);

    const metadata = await generateMetadata({ params: makeParams('missing') });

    expect(metadata).toEqual({});
  });
});

describe('DynamicPage — about slug (personJsonLd path)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('renders StoryblokStory with personJsonLd script for about slug', async () => {
    const story = createMockPageStory();
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'pages' });

    const Component = await DynamicPage({ params: makeParams('about') });
    const { container } = render(Component);

    expect(screen.getByTestId('storyblok-story')).toBeInTheDocument();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    const parsed = JSON.parse(script!.innerHTML.replaceAll(String.raw`\u003c`, '<'));
    expect(parsed['@type']).toBe('Person');
  });
});

describe('DynamicPage — generic non-post page (no JSON-LD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('renders StoryblokStory without script for a non-post, non-about page', async () => {
    const story: typeof createMockPageStory extends () => infer R ? R : never = {
      ...createMockPageStory(),
      slug: 'contact',
      full_slug: 'contact',
    };
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'pages' });

    const Component = await DynamicPage({ params: makeParams('contact') });
    const { container } = render(Component);

    expect(screen.getByTestId('storyblok-story')).toBeInTheDocument();
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
});

describe('generateMetadata — ogType branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('uses ogType=profile for about slug', async () => {
    const story = createMockPageStory();
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'pages' });

    const metadata = await generateMetadata({ params: makeParams('about') });
    expect(metadata.openGraph?.type).toBe('profile');
  });

  it('uses ogType=website for other non-post pages', async () => {
    const story = { ...createMockPageStory(), slug: 'contact', full_slug: 'contact' };
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'pages' });

    const metadata = await generateMetadata({ params: makeParams('contact') });
    expect(metadata.openGraph?.type).toBe('website');
  });

  it('omits article:tag when story has no tags', async () => {
    const story = { ...createMockPostStory(), tag_list: [] };
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'posts' });

    const metadata = await generateMetadata({ params: makeParams('my-post') });
    expect((metadata.other as Record<string, unknown>)?.['article:tag']).toBeUndefined();
  });
});

describe('DynamicPage — JSON-LD escaping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('escapes < in JSON-LD to prevent XSS', async () => {
    const story = {
      ...createMockPostStory(),
      content: {
        ...createMockPostStory().content,
        title: 'A <script> title',
        excerpt: 'desc',
      },
    };
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'posts' });

    const Component = await DynamicPage({ params: makeParams('my-post') });
    const { container } = render(Component);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    // The raw innerHTML should not contain literal < from injected title
    expect(script!.innerHTML).not.toContain('<script>');
    expect(script!.innerHTML).toContain(String.raw`\u003c`);
  });
});

describe('generateMetadata — title and description fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('falls back to story.name when og_title and title are both absent', async () => {
    const story = {
      ...createMockPageStory(),
      name: 'Fallback Name',
      content: {
        ...createMockPageStory().content,
        og_title: undefined as unknown as string,
        title: undefined as unknown as string,
      },
    };
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'pages' });

    const metadata = await generateMetadata({ params: makeParams('about') });
    expect(metadata.title).toBe('Fallback Name');
  });

  it('uses empty string description when both og_description and excerpt are absent', async () => {
    const story = {
      ...createMockPageStory(),
      content: {
        ...createMockPageStory().content,
        og_description: undefined as unknown as string,
        excerpt: undefined as unknown as string,
      },
    };
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'pages' });

    const metadata = await generateMetadata({ params: makeParams('about') });
    expect(metadata.description).toBe('');
  });
});

describe('generateMetadata — date fallback branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('falls back to created_at when first_published_at is null (line 82)', async () => {
    const story = {
      ...createMockPostStory(),
      first_published_at: null as unknown as string,
      published_at: null as unknown as string,
      created_at: '2024-06-01T00:00:00.000Z',
    };
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'posts' });

    const metadata = await generateMetadata({ params: makeParams('my-post') });
    // Should succeed — datePublished falls back to created_at
    expect(metadata.other?.['article:published_time']).toBe('2024-06-01T00:00:00.000Z');
    expect(metadata.other?.['article:modified_time']).toBe('2024-06-01T00:00:00.000Z');
  });
});

describe('DynamicPage — title/description fallbacks in post JSON-LD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('falls back to story.name when post title is absent (line 113)', async () => {
    const story = {
      ...createMockPostStory(),
      name: 'Story Name Used',
      content: {
        ...createMockPostStory().content,
        title: undefined as unknown as string,
        excerpt: '',
      },
    };
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'posts' });

    const Component = await DynamicPage({ params: makeParams('my-post') });
    const { container } = render(Component);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    const parsed = JSON.parse(script!.innerHTML.replaceAll(String.raw`\u003c`, '<'));
    expect(parsed.headline).toBe('Story Name Used');
  });

  it('uses empty description when excerpt is absent in post JSON-LD (line 114)', async () => {
    const story = {
      ...createMockPostStory(),
      content: {
        ...createMockPostStory().content,
        excerpt: undefined as unknown as string,
      },
    };
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'posts' });

    const Component = await DynamicPage({ params: makeParams('my-post') });
    const { container } = render(Component);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    const parsed = JSON.parse(script!.innerHTML.replaceAll(String.raw`\u003c`, '<'));
    // description should be empty string when no excerpt
    expect(parsed.description).toBe('');
  });
});

describe('DynamicPage — date fallback in JSON-LD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  it('uses created_at fallback when first_published_at and published_at are null', async () => {
    const story = {
      ...createMockPostStory(),
      first_published_at: null as unknown as string,
      published_at: null as unknown as string,
      created_at: '2024-07-01T00:00:00.000Z',
    };
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'posts' });

    const Component = await DynamicPage({ params: makeParams('my-post') });
    const { container } = render(Component);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    const parsed = JSON.parse(script!.innerHTML.replaceAll(String.raw`\u003c`, '<'));
    expect(parsed.datePublished).toBe('2024-07-01T00:00:00.000Z');
  });
});

describe('DynamicPage — Phase 3 JSON-LD enrichment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteUrl.mockReturnValue('https://example.com');
  });

  const parseJsonLd = (container: HTMLElement) => {
    const script = container.querySelector('script[type="application/ld+json"]');
    return JSON.parse(script!.innerHTML.replaceAll(String.raw`\u003c`, '<'));
  };

  it('adds serializer-derived articleBody and SoftwareSourceCode hasPart', async () => {
    const story = {
      ...createMockPostStory(),
      content: {
        ...createMockPostStory().content,
        body: [
          {
            _uid: 'r',
            component: 'richtext',
            content: {
              type: 'doc',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Intro prose.' }] }],
            },
          },
          {
            _uid: 'c',
            component: 'code_tabs',
            tabs: [
              { _uid: 't', component: 'code_tab', label: 'app.ts', language: 'ts', code: 'const a = 1;', filename: 'app.ts' },
            ],
          },
        ] as unknown as PostBlok['body'],
      },
    };
    mockFetchStoryBySlug.mockResolvedValue({ story, source: 'posts' });

    const Component = await DynamicPage({ params: makeParams('my-post') });
    const { container } = render(Component);
    const parsed = parseJsonLd(container);

    expect(parsed.articleBody).toContain('Intro prose.');
    expect(parsed.articleBody).not.toContain('const a = 1;');
    expect(parsed.hasPart).toEqual([
      {
        '@type': 'SoftwareSourceCode',
        name: 'app.ts',
        programmingLanguage: 'ts',
        url: 'https://example.com/my-post.md',
      },
    ]);
  });

  it('omits articleBody/hasPart for a post with an empty body (regression)', async () => {
    mockFetchStoryBySlug.mockResolvedValue({ story: createMockPostStory(), source: 'posts' });

    const Component = await DynamicPage({ params: makeParams('my-post') });
    const { container } = render(Component);
    const parsed = parseJsonLd(container);

    expect(parsed).not.toHaveProperty('articleBody');
    expect(parsed).not.toHaveProperty('hasPart');
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

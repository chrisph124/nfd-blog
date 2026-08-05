import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PostBlok, StoryblokStory } from '@/types/storyblok';

const mockGetTagCensus = vi.fn();
const mockResolveTagName = vi.fn();
const mockSelectPostsForTag = vi.fn();
const mockNotFound = vi.fn();

vi.mock('@/lib/tags', () => ({
  getTagCensus: () => mockGetTagCensus(),
  resolveTagName: (...args: unknown[]) => mockResolveTagName(...args),
  selectPostsForTag: (...args: unknown[]) => mockSelectPostsForTag(...args),
}));

vi.mock('@/lib/storyblok', () => ({
  getSiteUrl: () => 'https://example.com',
}));

vi.mock('@/components/organisms/PostGrid', () => ({
  default: ({ posts }: { posts: unknown[] }) => (
    <div data-testid="post-grid" data-count={posts.length} />
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    mockNotFound();
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import TagArchivePage, { generateMetadata } from '@/app/tags/[tag]/page';

const mkPost = (slug: string, name: string, title?: string): StoryblokStory<PostBlok> =>
  ({
    uuid: `u-${slug}`,
    name,
    full_slug: `posts/${slug}`,
    content: { title },
  } as unknown as StoryblokStory<PostBlok>);

const params = (tag: string) => Promise.resolve({ tag });

const readJsonLd = (container: HTMLElement) => {
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script?.textContent ?? '{}');
};

const okCensus = { ok: true as const, census: {} as never, posts: [] };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TagArchivePage', () => {
  it('throws (uncached 500) when the census is unavailable — never a cached 404 (RT#6)', async () => {
    mockGetTagCensus.mockResolvedValue({ ok: false });

    await expect(TagArchivePage({ params: params('ai') })).rejects.toThrow(
      /census unavailable/i,
    );
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it('calls notFound() for a slug that does not resolve to an archived tag', async () => {
    mockGetTagCensus.mockResolvedValue(okCensus);
    mockResolveTagName.mockReturnValue(null);

    await expect(TagArchivePage({ params: params('ghost') })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it('renders the archive with heading, post count, and grid for a resolved tag', async () => {
    mockGetTagCensus.mockResolvedValue(okCensus);
    mockResolveTagName.mockReturnValue('AI');
    mockSelectPostsForTag.mockReturnValue([
      mkPost('first', 'First', 'First title'),
      mkPost('second', 'Second'),
    ]);

    render(await TagArchivePage({ params: params('ai') }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI');
    expect(screen.getByText('2 posts')).toBeInTheDocument();
    expect(screen.getByTestId('post-grid')).toHaveAttribute('data-count', '2');
    // Breadcrumb ends at the tag name.
    expect(screen.getByText('Home')).toHaveAttribute('href', '/');
    expect(screen.getByText('Tags')).toHaveAttribute('href', '/tags');
  });

  it('uses the singular "post" for a single-post archive', async () => {
    mockGetTagCensus.mockResolvedValue(okCensus);
    mockResolveTagName.mockReturnValue('AI');
    mockSelectPostsForTag.mockReturnValue([mkPost('only', 'Only', 'Only title')]);

    render(await TagArchivePage({ params: params('ai') }));

    expect(screen.getByText('1 post')).toBeInTheDocument();
  });

  it('emits CollectionPage JSON-LD listing the posts with stripped URLs', async () => {
    mockGetTagCensus.mockResolvedValue(okCensus);
    mockResolveTagName.mockReturnValue('AI');
    mockSelectPostsForTag.mockReturnValue([
      mkPost('first', 'First', 'First title'),
      mkPost('second', 'Second Name'), // no content.title → falls back to name
    ]);

    const { container } = render(await TagArchivePage({ params: params('ai') }));
    const jsonLd = readJsonLd(container);

    expect(jsonLd['@type']).toBe('CollectionPage');
    expect(jsonLd.name).toBe('AI');
    expect(jsonLd.url).toBe('https://example.com/tags/ai');
    expect(jsonLd.mainEntity.numberOfItems).toBe(2);
    expect(jsonLd.mainEntity.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, url: 'https://example.com/first', name: 'First title' },
      { '@type': 'ListItem', position: 2, url: 'https://example.com/second', name: 'Second Name' },
    ]);
  });
});

describe('generateMetadata (tags/[tag])', () => {
  it('returns SEO metadata for a resolved tag', async () => {
    mockGetTagCensus.mockResolvedValue(okCensus);
    mockResolveTagName.mockReturnValue('AI');

    const metadata = await generateMetadata({ params: params('ai') });

    expect(metadata.title).toBe('AI — Articles & Notes');
    expect(metadata.alternates?.canonical).toBe('/tags/ai');
    expect(metadata.openGraph?.url).toBe('https://example.com/tags/ai');
    expect(metadata.openGraph?.type).toBe('website');
  });

  it('returns an empty object when the census is unavailable', async () => {
    mockGetTagCensus.mockResolvedValue({ ok: false });

    const metadata = await generateMetadata({ params: params('ai') });
    expect(metadata).toEqual({});
  });

  it('returns an empty object when the slug does not resolve', async () => {
    mockGetTagCensus.mockResolvedValue(okCensus);
    mockResolveTagName.mockReturnValue(null);

    const metadata = await generateMetadata({ params: params('ghost') });
    expect(metadata).toEqual({});
  });
});

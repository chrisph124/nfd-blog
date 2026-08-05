import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { ArchivedTag } from '@/lib/tags';

const mockGetTagCensus = vi.fn();
const mockSelectArchivedTags = vi.fn();

vi.mock('@/lib/tags', () => ({
  getTagCensus: () => mockGetTagCensus(),
  selectArchivedTags: (...args: unknown[]) => mockSelectArchivedTags(...args),
}));

vi.mock('@/lib/storyblok', () => ({
  getSiteUrl: () => 'https://example.com',
}));

import TagsIndexPage, { generateMetadata } from '@/app/tags/page';

const okCensus = { ok: true as const, census: {} as never, posts: [] };

const readJsonLd = (container: HTMLElement) => {
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script?.textContent ?? '{}');
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TagsIndexPage', () => {
  it('throws when the census is unavailable rather than caching an empty hub (RT#6)', async () => {
    mockGetTagCensus.mockResolvedValue({ ok: false });

    await expect(TagsIndexPage()).rejects.toThrow(/census unavailable/i);
  });

  it('renders the empty state when there are no archived tags', async () => {
    mockGetTagCensus.mockResolvedValue(okCensus);
    mockSelectArchivedTags.mockReturnValue([] as ArchivedTag[]);

    const { container } = render(await TagsIndexPage());

    expect(screen.getByText('No tags yet — check back soon.')).toBeInTheDocument();
    expect(container.querySelector('ul')).not.toBeInTheDocument();
  });

  it('renders archived tags in order with links and counts', async () => {
    mockGetTagCensus.mockResolvedValue(okCensus);
    mockSelectArchivedTags.mockReturnValue([
      { slug: 'ai', name: 'AI', count: 3 },
      { slug: 'tech', name: 'Tech', count: 2 },
    ] as ArchivedTag[]);

    render(await TagsIndexPage());

    const ai = screen.getByRole('link', { name: /AI/ });
    const tech = screen.getByRole('link', { name: /Tech/ });

    expect(ai).toHaveAttribute('href', '/tags/ai');
    expect(tech).toHaveAttribute('href', '/tags/tech');
    // Counts rendered alongside each pill.
    expect(ai).toHaveTextContent('3');
    expect(tech).toHaveTextContent('2');
    // Source order is preserved in the DOM (AI before Tech).
    expect(ai.compareDocumentPosition(tech) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('styles pills at 16px, forced white, no underline, with a white count circle', async () => {
    mockGetTagCensus.mockResolvedValue(okCensus);
    mockSelectArchivedTags.mockReturnValue([
      { slug: 'ai', name: 'AI', count: 3 },
    ] as ArchivedTag[]);

    render(await TagsIndexPage());

    const pill = screen.getByRole('link', { name: /AI/ });
    // 16px label, forced white + no underline (beats the unlayered global `a` rule).
    expect(pill).toHaveClass('text-base', 'text-white!', 'no-underline!');

    // Count in a 24px (size-6) white circle with an AA-safe deep-magenta number.
    const circle = within(pill).getByText('3');
    expect(circle).toHaveClass('bg-white', 'text-[#BE3455]', 'rounded-full', 'size-6');
  });

  it('emits CollectionPage JSON-LD listing every archived tag', async () => {
    mockGetTagCensus.mockResolvedValue(okCensus);
    mockSelectArchivedTags.mockReturnValue([
      { slug: 'ai', name: 'AI', count: 3 },
      { slug: 'tech', name: 'Tech', count: 2 },
    ] as ArchivedTag[]);

    const { container } = render(await TagsIndexPage());
    const jsonLd = readJsonLd(container);

    expect(jsonLd['@type']).toBe('CollectionPage');
    expect(jsonLd.url).toBe('https://example.com/tags');
    expect(jsonLd.mainEntity.numberOfItems).toBe(2);
    expect(jsonLd.mainEntity.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, url: 'https://example.com/tags/ai', name: 'AI' },
      { '@type': 'ListItem', position: 2, url: 'https://example.com/tags/tech', name: 'Tech' },
    ]);
  });
});

describe('generateMetadata (tags index)', () => {
  it('returns the browse-by-topic metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Tags — Browse by Topic');
    expect(metadata.alternates?.canonical).toBe('/tags');
    expect(metadata.openGraph?.url).toBe('https://example.com/tags');
    expect(metadata.openGraph?.type).toBe('website');
  });
});

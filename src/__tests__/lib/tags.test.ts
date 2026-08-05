import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PostBlok, StoryblokStory } from '@/types/storyblok';

const mockFetchAllPosts = vi.fn();

vi.mock('@/lib/storyblok', () => ({
  fetchAllPosts: () => mockFetchAllPosts(),
}));

import {
  THRESHOLD,
  slugify,
  buildTagCensus,
  selectArchivedTags,
  resolveTagName,
  selectPostsForTag,
  isTagLinkable,
  buildTagLinks,
  getTagCensus,
} from '@/lib/tags';
import type { TagCensus } from '@/lib/tags';

// Only `tag_list` is read to build the census; the returned post objects are
// compared by identity, so a minimal shape is enough for the fixtures.
const mkPost = (uuid: string, tags: string[]): StoryblokStory<PostBlok> =>
  ({ uuid, tag_list: tags } as unknown as StoryblokStory<PostBlok>);

// A census with one archived tag ('AI', exactly at THRESHOLD) and one
// sub-threshold tag ('Retired', THRESHOLD - 1 posts). At THRESHOLD=1 'Retired'
// sits at count 0 — a slug still mapped but whose last post dropped the tag (the
// shrink/untagged case the sub-threshold guards exist for). Built by hand rather
// than from posts because a sub-threshold tag cannot arise from post data once
// THRESHOLD is 1. Expressed via THRESHOLD so it holds at any knob value.
const archivedPost = mkPost('archived', ['AI']);
const subThresholdCensus = (): TagCensus => ({
  counts: new Map([
    ['AI', THRESHOLD],
    ['Retired', THRESHOLD - 1],
  ]),
  membership: new Map([
    ['AI', [archivedPost]],
    ['Retired', []],
  ]),
  slugToName: new Map([
    ['ai', 'AI'],
    ['retired', 'Retired'],
  ]),
  nameToSlug: new Map([
    ['AI', 'ai'],
    ['Retired', 'retired'],
  ]),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('slugify', () => {
  it('lowercases and converts spaces/underscores to single hyphens', () => {
    expect(slugify('Machine Learning')).toBe('machine-learning');
    expect(slugify('React_Hooks')).toBe('react-hooks');
    expect(slugify('Multi   Word')).toBe('multi-word');
  });

  it('strips characters outside [a-z0-9-]', () => {
    expect(slugify('C++')).toBe('c');
    expect(slugify('Café')).toBe('caf');
    expect(slugify('Node.js')).toBe('nodejs');
  });

  it('collapses repeated hyphens and trims leading/trailing hyphens', () => {
    expect(slugify('a--b')).toBe('a-b');
    expect(slugify('  Spaced  ')).toBe('spaced');
    expect(slugify('-lead-trail-')).toBe('lead-trail');
  });

  it('is idempotent for an already-clean slug', () => {
    expect(slugify('already-clean')).toBe('already-clean');
    expect(slugify(slugify('Already Clean'))).toBe('already-clean');
  });

  it('returns an empty string when no usable characters remain', () => {
    expect(slugify('!!!')).toBe('');
    expect(slugify('   ')).toBe('');
  });
});

describe('buildTagCensus', () => {
  it('counts occurrences and records membership in source order', () => {
    const p1 = mkPost('p1', ['AI', 'Tech']);
    const p2 = mkPost('p2', ['AI']);
    const p3 = mkPost('p3', ['Tech', 'AI']);
    const census = buildTagCensus([p1, p2, p3]);

    expect(census.counts.get('AI')).toBe(3);
    expect(census.counts.get('Tech')).toBe(2);
    expect(census.membership.get('AI')).toEqual([p1, p2, p3]);
    expect(census.membership.get('Tech')).toEqual([p1, p3]);
  });

  it('dedupes tags within a single post so a duplicate cannot inflate a count', () => {
    const p1 = mkPost('p1', ['AI', 'AI', 'AI']);
    const census = buildTagCensus([p1]);

    expect(census.counts.get('AI')).toBe(1);
    expect(census.membership.get('AI')).toEqual([p1]);
  });

  it('dedupes whitespace variants within a post so one post cannot self-promote a tag', () => {
    // "AI" and " AI" trim to the same name — a single post must count once and
    // appear once in membership, never twice. Count stays 1 (not 3), so the tag
    // surfaces in exactly one archive entry rather than a self-inflated one.
    const p1 = mkPost('p1', ['AI', ' AI', 'AI ']);
    const census = buildTagCensus([p1]);

    expect(census.counts.get('AI')).toBe(1);
    expect(census.membership.get('AI')).toEqual([p1]);
    expect(selectArchivedTags(census)).toEqual([{ slug: 'ai', name: 'AI', count: 1 }]);
  });

  it('trims whitespace and skips empty/whitespace-only tags', () => {
    const p1 = mkPost('p1', ['  AI  ', '', '   ']);
    const census = buildTagCensus([p1]);

    expect(census.counts.get('AI')).toBe(1);
    expect(census.counts.has('')).toBe(false);
    expect([...census.counts.keys()]).toEqual(['AI']);
  });

  it('handles a missing tag_list without throwing', () => {
    const census = buildTagCensus([mkPost('p1', undefined as unknown as string[])]);
    expect(census.counts.size).toBe(0);
  });

  it('maps slug ↔ name for slugifiable, non-collided tags', () => {
    const census = buildTagCensus([mkPost('p1', ['Machine Learning'])]);

    expect(census.slugToName.get('machine-learning')).toBe('Machine Learning');
    expect(census.nameToSlug.get('Machine Learning')).toBe('machine-learning');
  });

  it('fails OPEN on a slug collision: warns, maps neither, never throws (RT#1)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // "C++" and "C" both slugify to "c"; both are above threshold.
    const posts = [
      mkPost('p1', ['C++', 'C']),
      mkPost('p2', ['C++', 'C']),
    ];

    let census!: ReturnType<typeof buildTagCensus>;
    expect(() => {
      census = buildTagCensus(posts);
    }).not.toThrow();

    expect(warn).toHaveBeenCalled();
    // Neither owner is committed — no last-writer-wins merge.
    expect(census.slugToName.has('c')).toBe(false);
    expect(census.nameToSlug.has('C++')).toBe(false);
    expect(census.nameToSlug.has('C')).toBe(false);
    // But the counts still reflect reality (used by other surfaces).
    expect(census.counts.get('C++')).toBe(2);
    warn.mockRestore();
  });

  it('warns and excludes a tag with no usable slug (unslugifiable)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const census = buildTagCensus([mkPost('p1', ['!!!']), mkPost('p2', ['!!!'])]);

    expect(warn).toHaveBeenCalled();
    expect(census.counts.get('!!!')).toBe(2);
    expect(census.nameToSlug.has('!!!')).toBe(false);
    warn.mockRestore();
  });
});

describe('selectArchivedTags', () => {
  it('includes only tags at or above THRESHOLD, excluding sub-threshold ones', () => {
    // 'AI' sits at THRESHOLD (archived); 'Retired' is one below (excluded) —
    // holds whatever THRESHOLD is set to.
    const census = subThresholdCensus();
    const archived = selectArchivedTags(census);

    expect(archived.map((t) => t.name)).toEqual(['AI']);
    expect(archived[0]).toEqual({ slug: 'ai', name: 'AI', count: THRESHOLD });
  });

  it('orders by count descending, then alphabetically as a tie-break (VL#4)', () => {
    const census = buildTagCensus([
      mkPost('p1', ['AI', 'Zebra', 'Alpha']),
      mkPost('p2', ['AI', 'Zebra', 'Alpha']),
      mkPost('p3', ['AI']),
    ]);
    const archived = selectArchivedTags(census);

    // AI=3 first; Alpha=2 and Zebra=2 tie → alphabetical.
    expect(archived.map((t) => t.name)).toEqual(['AI', 'Alpha', 'Zebra']);
  });

  it('returns an empty array for an empty census', () => {
    expect(selectArchivedTags(buildTagCensus([]))).toEqual([]);
  });
});

describe('resolveTagName', () => {
  const census = buildTagCensus([
    mkPost('p1', ['AI', 'Solo']),
    mkPost('p2', ['AI']),
  ]);

  it('returns the display name for an archived slug', () => {
    expect(resolveTagName(census, 'ai')).toBe('AI');
  });

  it('returns null for a thin (below-threshold) slug', () => {
    // 'retired' is a mapped slug whose count sits below THRESHOLD — the archive
    // 404 path (VL#1 shrink-below-threshold), distinct from an unknown slug.
    expect(resolveTagName(subThresholdCensus(), 'retired')).toBeNull();
  });

  it('returns null for an unknown slug', () => {
    expect(resolveTagName(census, 'nope')).toBeNull();
  });

  it('is prototype-safe: dangerous keys resolve to null (RT#11)', () => {
    expect(resolveTagName(census, '__proto__')).toBeNull();
    expect(resolveTagName(census, 'constructor')).toBeNull();
    expect(resolveTagName(census, 'toString')).toBeNull();
  });
});

describe('selectPostsForTag', () => {
  const p1 = mkPost('p1', ['AI', 'Solo']);
  const p2 = mkPost('p2', ['AI']);
  const census = buildTagCensus([p1, p2]);

  it('returns posts for an archived slug, in membership order', () => {
    expect(selectPostsForTag(census, 'ai')).toEqual([p1, p2]);
  });

  it('returns [] for a thin slug', () => {
    expect(selectPostsForTag(subThresholdCensus(), 'retired')).toEqual([]);
  });

  it('returns [] for an unknown slug', () => {
    expect(selectPostsForTag(census, 'ghost')).toEqual([]);
  });
});

describe('isTagLinkable', () => {
  const census = buildTagCensus([
    mkPost('p1', ['AI', 'Solo']),
    mkPost('p2', ['AI']),
  ]);

  it('is true for an archived name', () => {
    expect(isTagLinkable(census, 'AI')).toBe(true);
  });

  it('is false for a thin name', () => {
    expect(isTagLinkable(subThresholdCensus(), 'Retired')).toBe(false);
  });

  it('is false for an unknown name', () => {
    expect(isTagLinkable(census, 'Nope')).toBe(false);
  });

  it('is prototype-safe (RT#11)', () => {
    expect(isTagLinkable(census, '__proto__')).toBe(false);
    expect(isTagLinkable(census, 'constructor')).toBe(false);
    expect(isTagLinkable(census, 'toString')).toBe(false);
  });
});

describe('buildTagLinks', () => {
  const census = buildTagCensus([
    mkPost('p1', ['AI', 'Solo']),
    mkPost('p2', ['AI']),
  ]);

  it('marks an archived tag linkable with its committed slug', () => {
    const links = buildTagLinks(census, ['AI']);
    expect(links.get('AI')).toEqual({ slug: 'ai', linkable: true });
  });

  it('marks a thin tag non-linkable but still carries a fallback slug', () => {
    // 'Retired' has a committed slug but sits below THRESHOLD → span, not link.
    const links = buildTagLinks(subThresholdCensus(), ['Retired']);
    expect(links.get('Retired')).toEqual({ slug: 'retired', linkable: false });
  });

  it('falls back to slugify() for a tag absent from the census map', () => {
    const links = buildTagLinks(census, ['Brand New']);
    expect(links.get('Brand New')).toEqual({ slug: 'brand-new', linkable: false });
  });

  it('dedupes and trims tag names, skipping empties', () => {
    const links = buildTagLinks(census, ['AI', 'AI', '  ', '']);
    expect([...links.keys()]).toEqual(['AI']);
  });

  it('trims the key so a padded tag matches its census entry', () => {
    const links = buildTagLinks(census, ['  AI  ']);
    expect(links.get('AI')).toEqual({ slug: 'ai', linkable: true });
  });

  it('renders a collided tag as non-linkable (fail-open, RT#1)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const collided = buildTagCensus([
      mkPost('p1', ['C++', 'C']),
      mkPost('p2', ['C++', 'C']),
    ]);
    const links = buildTagLinks(collided, ['C++']);
    expect(links.get('C++')).toEqual({ slug: 'c', linkable: false });
    warn.mockRestore();
  });
});

describe('getTagCensus (RT#6 — fetch failure ≠ empty)', () => {
  it('returns { ok: false } when fetchAllPosts yields no posts', async () => {
    mockFetchAllPosts.mockResolvedValue([]);
    const result = await getTagCensus();
    expect(result).toEqual({ ok: false });
  });

  it('returns { ok: true } with census and posts when posts exist', async () => {
    const posts = [mkPost('p1', ['AI']), mkPost('p2', ['AI'])];
    mockFetchAllPosts.mockResolvedValue(posts);

    const result = await getTagCensus();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.posts).toBe(posts);
      expect(result.census.counts.get('AI')).toBe(2);
    }
  });
});

describe('THRESHOLD', () => {
  it('is the single archival knob and equals 1', () => {
    expect(THRESHOLD).toBe(1);
  });
});

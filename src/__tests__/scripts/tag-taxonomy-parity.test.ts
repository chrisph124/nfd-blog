import { describe, it, expect, vi } from 'vitest';

// The runtime slugify lives in @/lib/tags, which transitively imports the whole
// Next/React component tree via @/lib/storyblok. Stub that module so this test
// pulls in only the pure slug algorithm, not the app.
vi.mock('@/lib/storyblok', () => ({
  fetchAllPosts: vi.fn(async () => []),
}));

import { slugify as runtimeSlugify } from '@/lib/tags';
import {
  slugify as scriptSlugify,
  THRESHOLD as scriptThreshold,
  findSlugCollisions,
  applyMappingToTagList,
  tagListChanged,
  mappingTargets,
} from '../../../scripts/lib/tag-taxonomy';
import { THRESHOLD as runtimeThreshold } from '@/lib/tags';

// One shared table exercising every slugify branch plus the real VL#3 tag names
// and their known edge cases (notably CI/CD → "cicd", not "ci-cd").
const NAMES = [
  'AI',
  'AI Agents',
  'AI Engineering',
  'AgenticAI',
  'CI/CD',
  'CI CD',
  'CI-CD',
  'Context Engineering',
  'Web Development',
  'Second Brain',
  'Next.js',
  'Node.js',
  'VS Code',
  'LLMs',
  'ROI',
  'roi',
  'A/B Testing',
  'C++',
  '.NET',
  'GPT-4',
  'Café',
  '日本語',
  '  leading and trailing  ',
  'multi   space',
  'under_score',
  'mixed_ _-_separators',
  'Trailing-',
  '-Leading',
  '!!!',
  '',
];

describe('script tag-taxonomy stays in parity with the runtime', () => {
  it('mirrors the runtime THRESHOLD', () => {
    expect(scriptThreshold).toBe(runtimeThreshold);
  });

  it.each(NAMES)('slugify(%j) matches @/lib/tags byte-for-byte', (name) => {
    expect(scriptSlugify(name)).toBe(runtimeSlugify(name));
  });
});

describe('findSlugCollisions', () => {
  it('flags two distinct names that collapse to one slug', () => {
    const collisions = findSlugCollisions(['ROI', 'roi']);
    expect(collisions).toHaveLength(1);
    expect(collisions[0].slug).toBe('roi');
    expect(new Set(collisions[0].names)).toEqual(new Set(['ROI', 'roi']));
  });

  it('returns nothing when every name owns a unique slug', () => {
    expect(findSlugCollisions(['AI', 'AI Agents', 'AI Engineering'])).toEqual([]);
  });

  it('does not flag a name repeated verbatim (same owner, not a collision)', () => {
    expect(findSlugCollisions(['AI', 'AI'])).toEqual([]);
  });

  it('surfaces unslugifiable names under the empty-string slug rather than dropping them', () => {
    const collisions = findSlugCollisions(['!!!', '###']);
    expect(collisions).toHaveLength(1);
    expect(collisions[0].slug).toBe('');
    expect(new Set(collisions[0].names)).toEqual(new Set(['!!!', '###']));
  });
});

describe('applyMappingToTagList', () => {
  it('swaps each old name for its canonical form', () => {
    expect(applyMappingToTagList(['roi', 'AI'], { roi: 'ROI' })).toEqual(['ROI', 'AI']);
  });

  it('keeps names absent from the mapping unchanged', () => {
    expect(applyMappingToTagList(['Foo Bar'], {})).toEqual(['Foo Bar']);
  });

  it('trims, drops empties, and de-duplicates while preserving first-seen order', () => {
    expect(applyMappingToTagList([' AI ', '', 'roi', 'ROI'], { roi: 'ROI' })).toEqual(['AI', 'ROI']);
  });

  it('returns an empty array for null/undefined input', () => {
    expect(applyMappingToTagList(null, {})).toEqual([]);
    expect(applyMappingToTagList(undefined, { a: 'b' })).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const input = ['roi'];
    applyMappingToTagList(input, { roi: 'ROI' });
    expect(input).toEqual(['roi']);
  });
});

describe('tagListChanged', () => {
  it('is false when the mapping is a no-op (order-insensitive)', () => {
    expect(tagListChanged(['AI', 'ROI'], ['ROI', 'AI'])).toBe(false);
  });

  it('is true when a name is added, removed, or renamed', () => {
    expect(tagListChanged(['roi'], ['ROI'])).toBe(true);
    expect(tagListChanged(['AI'], ['AI', 'ROI'])).toBe(true);
    expect(tagListChanged([' AI '], [])).toBe(true);
  });
});

describe('mappingTargets', () => {
  it('returns the distinct canonical target names', () => {
    const targets = mappingTargets({ roi: 'ROI', ROI: 'ROI', agenticai: 'AI Agents' });
    expect(new Set(targets)).toEqual(new Set(['ROI', 'AI Agents']));
  });
});

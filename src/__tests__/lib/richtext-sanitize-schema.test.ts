import { describe, it, expect, vi } from 'vitest';

// Force a minimal defaultSchema (no `attributes`/`tagNames`) so every
// `defaultSchema.attributes?.X || []` and `defaultSchema.tagNames || []` in the
// module takes its fallback branch. Hoisted `vi.mock` applies deterministically
// to this file's import of the module; the real-defaultSchema (left) branches
// are covered by the rest of the suite, which imports this module unmocked.
vi.mock('rehype-sanitize', () => ({ defaultSchema: {} }));

import { richtextSanitizeSchema } from '@/lib/richtext-sanitize-schema';

describe('richtextSanitizeSchema (minimal defaultSchema fallbacks)', () => {
  it('assembles from the blog additions alone when defaultSchema lacks attributes/tagNames', () => {
    expect(richtextSanitizeSchema.attributes?.img).toEqual(['loading', 'srcset', 'sizes', 'title']);
    expect(richtextSanitizeSchema.attributes?.iframe).toEqual(['loading', 'src', 'allowfullscreen']);
    expect(richtextSanitizeSchema.attributes?.video).toEqual(['preload', 'src', 'controls']);
    expect(richtextSanitizeSchema.attributes?.code).toEqual(['class']);
    expect(richtextSanitizeSchema.attributes?.pre).toEqual(['class']);
    expect(richtextSanitizeSchema.tagNames).toEqual([
      'iframe', 'video', 'source', 'figure', 'figcaption',
    ]);
  });

  it('overrides protocols with the blog allow-list', () => {
    expect(richtextSanitizeSchema.protocols?.href).toEqual(['http', 'https', 'mailto']);
    expect(richtextSanitizeSchema.protocols?.src).toEqual(['http', 'https']);
  });
});

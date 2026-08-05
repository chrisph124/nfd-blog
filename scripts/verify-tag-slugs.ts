/**
 * Ship-gate (RT#3/#9): re-pull the LIVE published tag list and prove it produces
 * clean, unique slugs. READ-ONLY — never writes. Exits non-zero on any slug
 * collision so it can gate a merge in CI or a pre-merge run, not just verify once
 * at bulk-completion.
 *
 * Uses the read-only Content Delivery token (the SAME token CI already holds as
 * `STORYBLOK_TOKEN`) — NOT the space-wide Management token. Reads published
 * `cdn/tags`, runs the Phase 1 `slugify()` (mirrored in ./lib/tag-taxonomy), and
 * fails if two distinct tag names collapse to one slug (e.g. `ROI`/`roi`) — the
 * residual-variant signal the retag migration must leave at zero.
 *
 *   DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/verify-tag-slugs.ts
 *   # or inline:
 *   STORYBLOK_TOKEN=xxx pnpm tsx scripts/verify-tag-slugs.ts
 *
 * Env:
 *   STORYBLOK_TOKEN  (preferred, matches ci.yml) or
 *   NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN — read-only content token.
 *   STORYBLOK_CONTENT_API_URL (optional) — defaults to the EU CDN host.
 */
import 'dotenv/config';
import { findSlugCollisions, slugify } from './lib/tag-taxonomy';

const TOKEN =
  process.env.STORYBLOK_TOKEN ?? process.env.NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN;
// EU CDN is the default (matches apiOptions.region: 'eu' in src/lib/storyblok.ts).
const CDN_BASE = process.env.STORYBLOK_CONTENT_API_URL ?? 'https://api.storyblok.com/v2/cdn';

interface StoryblokTag {
  name: string;
  taggings_count: number;
}

function requireToken(): string {
  if (!TOKEN) {
    console.error(
      'Missing read token. Set STORYBLOK_TOKEN (or NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN).',
    );
    process.exit(1);
  }
  return TOKEN;
}

async function fetchPublishedTags(token: string): Promise<StoryblokTag[]> {
  const url = `${CDN_BASE}/tags?token=${encodeURIComponent(token)}&version=published`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch cdn/tags: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { tags?: StoryblokTag[] };
  return data.tags ?? [];
}

async function main(): Promise<void> {
  const token = requireToken();
  const tags = await fetchPublishedTags(token);
  const names = tags.map((t) => t.name);

  console.log(`Pulled ${names.length} published tag(s) from cdn/tags.`);

  // Surface any name that slugifies to empty (unslugifiable — cannot own a URL).
  const unslugifiable = names.filter((name) => slugify(name) === '');
  if (unslugifiable.length > 0) {
    console.warn(`⚠ ${unslugifiable.length} tag(s) have no usable slug: ${unslugifiable.join(', ')}`);
  }

  const collisions = findSlugCollisions(names);
  if (collisions.length === 0) {
    console.log('✔ Ship-gate PASS — every tag maps to a unique slug; no casing/duplicate variants remain.');
    return;
  }

  console.error(`✗ Ship-gate FAIL — ${collisions.length} slug collision(s) on live published tags:`);
  for (const { slug, names: owners } of collisions) {
    console.error(`  "${slug}" ← ${owners.map((n) => `"${n}"`).join(', ')}`);
  }
  console.error('The retag migration is NOT done: merge/recase these before shipping Phases 2–3.');
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

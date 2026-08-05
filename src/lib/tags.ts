import { cache } from 'react';
import { fetchAllPosts } from '@/lib/storyblok';
import type { PostBlok, StoryblokStory } from '@/types/storyblok';

// ============================================================================
// Tag Taxonomy — single source of truth
// ----------------------------------------------------------------------------
// Every downstream surface (the `/tags` index, `/tags/[tag]` archives, post
// pills, and the sitemap) derives its facts from this module, which in turn
// reads the already `cache()`-wrapped `fetchAllPosts()`. One census, one
// traversal, no drift between what a page shows, what the sitemap lists, and
// what a pill links to.
// ============================================================================

/**
 * A tag becomes an "archived" (crawlable) tag once at least this many posts
 * carry it. Single knob — bump to `3` here and every surface follows.
 */
export const THRESHOLD = 2;

/**
 * Deterministic, idempotent slug for a human-readable tag name.
 * lowercase → spaces/underscores to `-` → strip non `[a-z0-9-]` → collapse
 * repeated `-` → trim leading/trailing `-`. An already-clean slug maps to
 * itself.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[\s_]+/g, '-')
    .replaceAll(/[^a-z0-9-]/g, '')
    .replaceAll(/-+/g, '-')
    // Repeats are already collapsed above, so at most one edge hyphen remains —
    // a single-char trim (no `+` quantifier → linear, no backtracking).
    .replaceAll(/^-|-$/g, '');
}

/**
 * One archived tag as shown on the `/tags` index and emitted to the sitemap.
 */
export interface ArchivedTag {
  slug: string;
  name: string;
  count: number;
}

/**
 * Per-tag link decision handed to `Post` (prop-drilled — `Post` never fetches).
 * `linkable: false` renders a plain `<span>` (thin, collided, or unslugifiable).
 */
export interface TagLink {
  slug: string;
  linkable: boolean;
}

/**
 * The whole-site tag census. All lookup surfaces are `Map`/`Set` so keys like
 * `__proto__`, `constructor`, `toString` resolve through `.get()`/`.has()` and
 * never surface an inherited member (RT#11).
 */
export interface TagCensus {
  /** display name → post count */
  counts: Map<string, number>;
  /** display name → posts carrying it, newest-first (source order preserved) */
  membership: Map<string, StoryblokStory<PostBlok>[]>;
  /** slug → display name; excludes collided and unslugifiable names */
  slugToName: Map<string, string>;
  /** display name → slug; excludes collided and unslugifiable names */
  nameToSlug: Map<string, string>;
}

/**
 * Result of the async census read. `ok: false` is the failure signal: because
 * `fetchAllPosts()` swallows upstream errors and returns `[]`, an empty result
 * is indistinguishable from a transient Storyblok failure, so we treat it
 * conservatively as a failure. Callers use this to serve stale / skip
 * `notFound()` rather than deindex live archives on a blip (RT#6).
 */
export type CensusResult =
  | { ok: true; census: TagCensus; posts: StoryblokStory<PostBlok>[] }
  | { ok: false };

/**
 * Tally per-tag counts and membership from the post set. Dedupes tags within a
 * post so a malformed duplicate tag can't inflate a single-post tag over
 * THRESHOLD; trims names and skips empties.
 */
function tallyTags(posts: StoryblokStory<PostBlok>[]): Pick<TagCensus, 'counts' | 'membership'> {
  const counts = new Map<string, number>();
  const membership = new Map<string, StoryblokStory<PostBlok>[]>();

  for (const post of posts) {
    // Dedupe on the TRIMMED name so a whitespace variant ("AI" and " AI") can't
    // count the same post twice or push it into membership twice.
    const names = new Set(
      (post.tag_list ?? []).map((raw) => raw?.trim()).filter((name): name is string => Boolean(name)),
    );
    for (const name of names) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
      const bucket = membership.get(name);
      if (bucket) bucket.push(post);
      else membership.set(name, [post]);
    }
  }

  return { counts, membership };
}

/**
 * Group display names by their slug, warning on and dropping any name that has
 * no usable slug (e.g. "!!!") — such a name cannot own an archive URL.
 */
function groupNamesBySlug(names: Iterable<string>): Map<string, string[]> {
  const slugToNames = new Map<string, string[]>();
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) {
      console.warn(`[tags] tag "${name}" has no usable slug; rendering non-linkable.`);
      continue;
    }
    const owners = slugToNames.get(slug);
    if (owners) owners.push(name);
    else slugToNames.set(slug, [name]);
  }
  return slugToNames;
}

/**
 * Commit the bidirectional slug ↔ name maps. A slug owned by more than one name
 * fails OPEN (RT#1): mark BOTH non-linkable (neither mapped) and warn — never
 * throw (no error.tsx → a throw here 500s every post page) and never
 * last-writer-merge.
 */
function commitSlugMaps(
  slugToNames: Map<string, string[]>,
): Pick<TagCensus, 'slugToName' | 'nameToSlug'> {
  const slugToName = new Map<string, string>();
  const nameToSlug = new Map<string, string>();
  for (const [slug, owners] of slugToNames) {
    if (owners.length > 1) {
      console.warn(
        `[tags] slug "${slug}" collides across ${owners.length} tags: ${owners.join(', ')}. Rendering all non-linkable.`,
      );
      continue;
    }
    slugToName.set(slug, owners[0]);
    nameToSlug.set(owners[0], slug);
  }
  return { slugToName, nameToSlug };
}

/**
 * Build the census from an in-memory post set. Pure and synchronous so it is
 * unit-testable with fixtures and reusable by the sitemap over the posts it has
 * already fetched (no second network call — RT#12).
 */
export function buildTagCensus(posts: StoryblokStory<PostBlok>[]): TagCensus {
  const { counts, membership } = tallyTags(posts);
  const { slugToName, nameToSlug } = commitSlugMaps(groupNamesBySlug(counts.keys()));
  return { counts, membership, slugToName, nameToSlug };
}

/**
 * Request-scoped async census read. Wrapped in `React.cache()` so the fetch AND
 * the O(n) reduce run once per request even when `generateMetadata` and the
 * page body both consult it (RT#15).
 */
export const getTagCensus = cache(async (): Promise<CensusResult> => {
  const posts = await fetchAllPosts();
  if (posts.length === 0) return { ok: false };
  return { ok: true, census: buildTagCensus(posts), posts };
});

/**
 * Archived tags for the index / sitemap: `count >= THRESHOLD`, resolvable slug
 * (collided and unslugifiable names are already excluded from `slugToName`).
 * Ordered post-count descending, alphabetical tie-break (VL#4).
 */
export function selectArchivedTags(census: TagCensus): ArchivedTag[] {
  const tags: ArchivedTag[] = [];
  for (const [slug, name] of census.slugToName) {
    const count = census.counts.get(name) ?? 0;
    if (count >= THRESHOLD) tags.push({ slug, name, count });
  }
  return tags.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Display name for an archived slug, or `null` for unknown, thin, collided, or
 * shrunk-below-threshold slugs (drives the archive 404 — VL#1, RT#11).
 */
export function resolveTagName(census: TagCensus, slug: string): string | null {
  const name = census.slugToName.get(slug);
  if (!name) return null;
  if ((census.counts.get(name) ?? 0) < THRESHOLD) return null;
  return name;
}

/**
 * Posts for an archived slug, newest-first. `[]` for any slug that does not
 * resolve to an archived tag.
 */
export function selectPostsForTag(
  census: TagCensus,
  slug: string,
): StoryblokStory<PostBlok>[] {
  const name = resolveTagName(census, slug);
  if (!name) return [];
  return census.membership.get(name) ?? [];
}

/**
 * Whether a display name should render as a link on a post pill: it must have a
 * committed (non-collided, slugifiable) slug AND meet the threshold. The global
 * census fact — never "always link".
 */
export function isTagLinkable(census: TagCensus, name: string): boolean {
  return census.nameToSlug.has(name) && (census.counts.get(name) ?? 0) >= THRESHOLD;
}

/**
 * Precompute the link decision for a post's `tag_list`, keyed by display name.
 * `[slug]/page.tsx` builds this once from the census and prop-drills it into the
 * synchronous `Post` template (RT#5). Returns a `Map` (prototype-safe consumer).
 */
export function buildTagLinks(
  census: TagCensus,
  tagList: string[],
): Map<string, TagLink> {
  const links = new Map<string, TagLink>();
  for (const name of tagList) {
    const key = name?.trim();
    if (!key || links.has(key)) continue;
    links.set(key, {
      slug: census.nameToSlug.get(key) ?? slugify(key),
      linkable: isTagLinkable(census, key),
    });
  }
  return links;
}

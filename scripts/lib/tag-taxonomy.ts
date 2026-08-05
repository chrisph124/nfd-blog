/**
 * Pure, dependency-free tag-taxonomy helpers shared by the Phase 4 migration
 * scripts (`retag-storyblok.ts`, `verify-tag-slugs.ts`).
 *
 * WHY A SECOND COPY OF `slugify`: the runtime `slugify` lives in
 * `src/lib/tags.ts`, which transitively imports the whole Next/React component
 * tree (`@/lib/storyblok` → every template), so a plain `tsx` node script cannot
 * import it. Phase 4 is also scoped to `scripts/` only (no `src/` runtime
 * changes). So the algorithm is mirrored here — and a parity test
 * (`src/__tests__/scripts/tag-taxonomy-parity.test.ts`) fails CI if this copy
 * ever diverges from the runtime one, keeping a single canonical slug algorithm
 * across the two files.
 *
 * No imports, no I/O, no top-level side effects — safe to import from a script
 * or a test.
 */

/** Mirror of `THRESHOLD` in `src/lib/tags.ts`. A tag needs this many posts to earn a page. */
export const THRESHOLD = 1;

/**
 * Deterministic, idempotent slug for a human-readable tag name.
 * MUST stay byte-for-byte behaviourally identical to `slugify` in
 * `src/lib/tags.ts` (enforced by the parity test).
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[\s_]+/g, '-')
    .replaceAll(/[^a-z0-9-]/g, '')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

/**
 * Old display name → new (canonical) display name. Merges are expressed as
 * multiple keys sharing one value (`"roi"` and `"ROI"` → `"ROI"`); a canonical
 * name mapping to itself keeps the migration idempotent.
 */
export type TagMapping = Record<string, string>;

/** A slug reached by two or more distinct display names — the invariant the runtime guard fails-open on. */
export interface SlugCollision {
  slug: string;
  names: string[];
}

/**
 * Group display names by their slug and return every slug owned by more than one
 * distinct name. An empty result means the set produces 1:1 slugs — the property
 * the approved mapping must satisfy at write-time so the runtime never has to
 * fail-open (RT#1/#9). Names with no usable slug (e.g. "!!!") are reported under
 * the empty-string slug so they surface rather than silently vanish.
 */
export function findSlugCollisions(names: Iterable<string>): SlugCollision[] {
  const bySlug = new Map<string, Set<string>>();
  for (const name of names) {
    const slug = slugify(name);
    const bucket = bySlug.get(slug);
    if (bucket) bucket.add(name);
    else bySlug.set(slug, new Set([name]));
  }
  const collisions: SlugCollision[] = [];
  for (const [slug, owners] of bySlug) {
    if (owners.size > 1) collisions.push({ slug, names: [...owners] });
  }
  return collisions;
}

/**
 * Apply the mapping to one story's `tag_list`: swap each old name for its
 * canonical form (unchanged if absent from the mapping), trim, drop empties, and
 * de-duplicate while preserving first-seen order. Pure — returns a new array and
 * never mutates the input.
 */
export function applyMappingToTagList(tagList: readonly string[] | null | undefined, mapping: TagMapping): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tagList ?? []) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    const mapped = (mapping[trimmed] ?? trimmed).trim();
    if (!mapped || seen.has(mapped)) continue;
    seen.add(mapped);
    out.push(mapped);
  }
  return out;
}

/** True when applying the mapping would change this story's tag_list (order-insensitive). */
export function tagListChanged(before: readonly string[] | null | undefined, after: readonly string[]): boolean {
  const a = new Set((before ?? []).map((t) => t?.trim()).filter(Boolean));
  const b = new Set(after);
  if (a.size !== b.size) return true;
  for (const name of b) if (!a.has(name)) return true;
  return false;
}

/** Distinct canonical (target) display names the mapping produces. */
export function mappingTargets(mapping: TagMapping): string[] {
  return [...new Set(Object.values(mapping).map((n) => n.trim()).filter(Boolean))];
}

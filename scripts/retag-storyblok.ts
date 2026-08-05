/**
 * Phase 4 taxonomy retag: rewrite each affected story's `tag_list` to canonical
 * Title-Case names per an author-approved old→new mapping, then PUBLISH.
 *
 * Storyblok has NO global "rename tag" — a tag is just a string in each story's
 * `tag_list`, so a merge/rename = rewrite + republish every affected story.
 *
 * SAFETY MODEL — this script never writes unless explicitly told to:
 *   mode `plan`   (default) : pull live tags + stories, load the mapping, show
 *                             the before→after diff and the target-slug table.
 *                             READ-ONLY.
 *   mode `backup`           : dump each affected story's FULL JSON (content +
 *                             tag_list) to a timestamped dir. READ-ONLY on
 *                             Storyblok; writes local files only (RT#2).
 *   mode `apply --yes`      : GET each full story → mutate ONLY tag_list → PUT
 *                             the COMPLETE payload with publish (never a partial
 *                             body, so `content` is never clobbered — RT#2).
 *                             Refuses without: an approved mapping that yields
 *                             1:1 slugs, a complete backup, `--yes`, and a
 *                             clean pre-flight drift check (RT#8). The first
 *                             story is asserted content-byte-identical before the
 *                             rest proceed (pilot, RT#2).
 *
 * Write mechanism is the RT#2-approved full GET-mutate-PUT (safe by construction)
 * rather than the tag_list-scoped Bulk Association endpoint; if you switch to the
 * bulk endpoint, verify its exact shape via the Storyblok MCP `describe` first.
 *
 *   DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/retag-storyblok.ts plan
 *   DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/retag-storyblok.ts backup
 *   DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/retag-storyblok.ts apply --pilot ROI --yes
 *   DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/retag-storyblok.ts apply --yes
 *
 * Flags: --mapping <path> (default scripts/tag-mapping.json)
 *        --backup-dir <path> (default scripts/.tag-backup)
 *        --pilot <tagName>  restrict to stories currently carrying <tagName>
 *        --limit <n>        cap number of stories processed (smoke runs)
 *        --yes              required to actually write in apply mode
 *
 * SECURITY: STORYBLOK_MANAGEMENT_TOKEN is space-wide write access — .env.local
 * only, never logged, never a CI secret. Also defer the publish webhook for the
 * bulk window and fire ONE manual revalidate after (RT#7); re-enable it when done.
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  applyMappingToTagList,
  findSlugCollisions,
  mappingTargets,
  slugify,
  tagListChanged,
  type TagMapping,
} from './lib/tag-taxonomy';

const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;
const SPACE_ID = process.env.STORYBLOK_SPACE_ID;
const API_BASE = process.env.STORYBLOK_MANAGEMENT_API_URL ?? 'https://mapi.storyblok.com/v1';
const WRITE_DELAY_MS = Number.parseInt(process.env.RETAG_WRITE_DELAY_MS ?? '350', 10);

type Mode = 'plan' | 'backup' | 'apply';

interface StorySummary {
  id: number;
  name: string;
  full_slug: string;
  tag_list?: string[];
}

interface FullStory {
  id: number;
  name: string;
  full_slug: string;
  tag_list?: string[];
  content?: Record<string, unknown>;
  [key: string]: unknown;
}

interface StoryblokTag {
  name: string;
  taggings_count: number;
}

interface CliOptions {
  mode: Mode;
  mappingPath: string;
  backupDir: string;
  pilotTag?: string;
  limit?: number;
  yes: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const positional = argv.find((a) => !a.startsWith('-'));
  const mode = (positional ?? 'plan') as Mode;
  if (!['plan', 'backup', 'apply'].includes(mode)) {
    console.error(`Unknown mode "${mode}". Use: plan | backup | apply.`);
    process.exit(1);
  }
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const limitRaw = flag('--limit');
  return {
    mode,
    mappingPath: flag('--mapping') ?? join('scripts', 'tag-mapping.json'),
    backupDir: flag('--backup-dir') ?? join('scripts', '.tag-backup'),
    pilotTag: flag('--pilot'),
    limit: limitRaw ? Number.parseInt(limitRaw, 10) : undefined,
    yes: argv.includes('--yes'),
  };
}

function requireEnv(): { token: string; spaceId: string } {
  if (!MANAGEMENT_TOKEN || !SPACE_ID) {
    console.error(
      'Missing env. Set STORYBLOK_MANAGEMENT_TOKEN and STORYBLOK_SPACE_ID (space-wide write token — .env.local only, never a CI secret).',
    );
    process.exit(1);
  }
  return { token: MANAGEMENT_TOKEN, spaceId: SPACE_ID };
}

function loadMapping(path: string): TagMapping {
  if (!existsSync(path)) {
    console.error(
      `No mapping at "${path}". Copy scripts/tag-mapping.example.json → ${path}, fill it from the live \`plan\` output, and get author approval before apply.`,
    );
    process.exit(1);
  }
  const mapping = JSON.parse(readFileSync(path, 'utf8')) as TagMapping;
  const collisions = findSlugCollisions(mappingTargets(mapping));
  if (collisions.length > 0) {
    console.error('Mapping REJECTED — target names collide on slug (violates the 1:1 invariant, RT#1/#9):');
    for (const c of collisions) console.error(`  "${c.slug}" ← ${c.names.map((n) => `"${n}"`).join(', ')}`);
    process.exit(1);
  }
  return mapping;
}

async function mapiGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: token } });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

async function listTags(token: string, spaceId: string): Promise<StoryblokTag[]> {
  // Paginate: the tags endpoint defaults to 25/page, so a single unpaged GET
  // silently drops later tags — which would make the drift guard (RT#8) falsely
  // report mapped source tags as "no longer live".
  const perPage = 100;
  const tags: StoryblokTag[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const data = await mapiGet<{ tags?: StoryblokTag[] }>(
      token,
      `/spaces/${spaceId}/tags?per_page=${perPage}&page=${page}`,
    );
    const batch = data.tags ?? [];
    tags.push(...batch);
    if (batch.length < perPage) break;
  }
  return tags;
}

async function listPostStories(token: string, spaceId: string): Promise<StorySummary[]> {
  const perPage = 100;
  const stories: StorySummary[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const data = await mapiGet<{ stories?: StorySummary[] }>(
      token,
      `/spaces/${spaceId}/stories?content_type=post&per_page=${perPage}&page=${page}`,
    );
    const batch = data.stories ?? [];
    stories.push(...batch);
    if (batch.length < perPage) break;
  }
  return stories;
}

async function getFullStory(token: string, spaceId: string, id: number): Promise<FullStory> {
  const data = await mapiGet<{ story: FullStory }>(token, `/spaces/${spaceId}/stories/${id}`);
  return data.story;
}

async function putStoryPublished(token: string, spaceId: string, story: FullStory): Promise<void> {
  const res = await fetch(`${API_BASE}/spaces/${spaceId}/stories/${story.id}`, {
    method: 'PUT',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    // Send the COMPLETE story object back (only tag_list mutated) + publish.
    body: JSON.stringify({ story, publish: 1 }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PUT story ${story.id} failed: ${res.status} ${res.statusText} — ${body}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Stories whose tag_list changes under the mapping (optionally scoped to a pilot tag). */
function selectAffected(stories: StorySummary[], mapping: TagMapping, pilotTag?: string, limit?: number): StorySummary[] {
  const affected = stories.filter((s) => {
    const current = s.tag_list ?? [];
    if (pilotTag && !current.map((t) => t.trim()).includes(pilotTag.trim())) return false;
    return tagListChanged(current, applyMappingToTagList(current, mapping));
  });
  return typeof limit === 'number' ? affected.slice(0, limit) : affected;
}

function printPlan(tags: StoryblokTag[], mapping: TagMapping, affected: StorySummary[]): void {
  console.log(`\nLive tags (${tags.length}):`);
  for (const t of [...tags].sort((a, b) => b.taggings_count - a.taggings_count)) {
    const target = mapping[t.name];
    const arrow = target && target !== t.name ? ` → "${target}"` : '';
    console.log(`  ${String(t.taggings_count).padStart(3)}  "${t.name}"${arrow}  [slug: ${slugify(target ?? t.name) || '(none)'}]`);
  }

  const unmapped = tags.map((t) => t.name).filter((n) => !(n in mapping));
  if (unmapped.length > 0) {
    console.log(`\n⚠ ${unmapped.length} live tag(s) absent from the mapping (kept as-is): ${unmapped.join(', ')}`);
  }

  console.log(`\nAffected stories (${affected.length}):`);
  for (const s of affected) {
    const after = applyMappingToTagList(s.tag_list, mapping);
    console.log(`  #${s.id} ${s.full_slug}`);
    console.log(`      before: [${(s.tag_list ?? []).join(', ')}]`);
    console.log(`      after:  [${after.join(', ')}]`);
  }
  console.log('\nplan mode is READ-ONLY. Next: get author approval, then `backup`, then `apply --yes`.');
}

async function runBackup(token: string, spaceId: string, dir: string, affected: StorySummary[]): Promise<void> {
  mkdirSync(dir, { recursive: true });
  const manifest: { id: number; full_slug: string; file: string }[] = [];
  for (const s of affected) {
    const full = await getFullStory(token, spaceId, s.id);
    const file = `story-${s.id}.json`;
    writeFileSync(join(dir, file), JSON.stringify(full, null, 2));
    manifest.push({ id: s.id, full_slug: s.full_slug, file });
    await sleep(WRITE_DELAY_MS);
  }
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`✔ Backed up ${affected.length} full story JSON(s) → ${dir}`);
  console.log('  Round-trip-restore ONE (PUT it back, diff content byte-identical) before trusting the bulk (RT#2).');
}

/** Pre-flight drift guard (RT#8): every live tag the mapping renames must still exist. */
function assertNoDrift(liveTags: StoryblokTag[], mapping: TagMapping): void {
  const live = new Set(liveTags.map((t) => t.name));
  const missingOlds = Object.keys(mapping).filter((old) => mapping[old] !== old && !live.has(old));
  if (missingOlds.length > 0) {
    console.error(`✗ Drift detected — mapped source tag(s) no longer live: ${missingOlds.join(', ')}. Re-pull \`plan\` and re-approve.`);
    process.exit(1);
  }
}

async function runApply(token: string, spaceId: string, opts: CliOptions, mapping: TagMapping, affected: StorySummary[]): Promise<void> {
  if (!opts.yes) {
    console.error('apply refused: pass --yes to confirm writes. Run `plan` and `backup` first.');
    process.exit(1);
  }
  if (!existsSync(join(opts.backupDir, 'manifest.json'))) {
    console.error(`apply refused: no backup manifest at ${opts.backupDir}. Run \`backup\` first (RT#2).`);
    process.exit(1);
  }

  let first = true;
  for (const s of affected) {
    if (!existsSync(join(opts.backupDir, `story-${s.id}.json`))) {
      console.error(`✗ apply halted: story #${s.id} has no backup. Re-run \`backup\` (RT#2).`);
      process.exit(1);
    }
    const before = await getFullStory(token, spaceId, s.id);
    const contentBefore = JSON.stringify(before.content ?? null);
    const newTagList = applyMappingToTagList(before.tag_list, mapping);

    await putStoryPublished(token, spaceId, { ...before, tag_list: newTagList });
    console.log(`✔ #${s.id} ${s.full_slug} → [${newTagList.join(', ')}]`);

    if (first) {
      // Pilot: prove the write touched ONLY tag_list before trusting the bulk (RT#2).
      const after = await getFullStory(token, spaceId, s.id);
      if (JSON.stringify(after.content ?? null) !== contentBefore) {
        console.error(`✗ HALT: story #${s.id} content changed — write is NOT tag_list-only. Restore from backup and investigate (RT#2).`);
        process.exit(1);
      }
      console.log('  ✔ pilot content byte-identical — write is tag_list-only; proceeding.');
      first = false;
    }
    await sleep(WRITE_DELAY_MS);
  }

  console.log(`\n✔ Retagged + published ${affected.length} stor${affected.length === 1 ? 'y' : 'ies'}.`);
  console.log('Now: fire ONE manual /api/revalidate, run scripts/verify-tag-slugs.ts against live cdn/tags, and re-enable the publish webhook (RT#7/#9).');
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const { token, spaceId } = requireEnv();
  const mapping = loadMapping(opts.mappingPath);

  const liveTags = await listTags(token, spaceId);
  const stories = await listPostStories(token, spaceId);
  const affected = selectAffected(stories, mapping, opts.pilotTag, opts.limit);

  if (opts.mode === 'plan') {
    printPlan(liveTags, mapping, affected);
    return;
  }
  if (opts.mode === 'backup') {
    await runBackup(token, spaceId, opts.backupDir, affected);
    return;
  }
  assertNoDrift(liveTags, mapping);
  await runApply(token, spaceId, opts, mapping, affected);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

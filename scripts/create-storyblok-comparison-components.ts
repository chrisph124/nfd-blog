/**
 * Provision CMS-authored `comparison` cards in a Storyblok space:
 *   1. create the `comparison_card` and `comparison` component schemas,
 *   2. file them under their atomic block-library folders (parent `comparison`
 *      → molecules, child `comparison_card` → atoms, mirroring code_tabs/code_tab),
 *      and
 *   3. add `comparison` to the `post` body field so editors can insert it
 *      alongside markdown/richtext/code_tabs/alert.
 *
 * One-time, LOCAL operation. Run by a human with a Management API token. The
 * create-storyblok-* scripts load `dotenv/config` (reads `.env`), while
 * `generate-types` targets `.env.local` — so point this script at `.env.local`:
 *
 *   DOTENV_CONFIG_PATH=.env.local \
 *     pnpm tsx scripts/create-storyblok-comparison-components.ts
 *   # or inline:
 *   STORYBLOK_MANAGEMENT_TOKEN=xxx STORYBLOK_SPACE_ID=123456 \
 *     pnpm tsx scripts/create-storyblok-comparison-components.ts
 *
 * Idempotent: existing components are skipped (not overwritten) and the body
 * whitelist is merged (never replaced), so re-runs are safe.
 *
 * SECURITY: the Management token is write-scoped to the ENTIRE space. Treat it
 * as a secret — env/.env.local only (gitignored), never logged, and NEVER added
 * as a GitHub Actions / CI secret (unlike the read-only content token in ci.yml).
 */
import 'dotenv/config';

const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;
const SPACE_ID = process.env.STORYBLOK_SPACE_ID;
// EU is the default Management API host (matches apiOptions.region: 'eu').
const API_BASE = process.env.STORYBLOK_MANAGEMENT_API_URL ?? 'https://mapi.storyblok.com/v1';

// Content type + field the comparison blok is made insertable in.
const POST_COMPONENT = 'post';
const COMPARISON_NAME = 'comparison';

interface ComponentDefinition {
  name: string;
  display_name: string;
  is_nestable: boolean;
  is_root: boolean;
  schema: Record<string, unknown>;
}

/** The parts of a schema field this script reads/writes. Extra keys pass through. */
interface SchemaField {
  type?: string;
  restrict_components?: boolean;
  restrict_type?: string;
  component_whitelist?: string[];
  [key: string]: unknown;
}

/** A component as returned by the Management API. Unread keys pass through PUT untouched. */
interface StoryblokComponent {
  id: number;
  name: string;
  schema?: Record<string, SchemaField>;
  component_group_uuid?: string | null;
  [key: string]: unknown;
}

// Field order + option values MUST match the ComparisonCardBlok interface in
// src/types/storyblok.ts so `generate-types` reproduces it with no diff.
const COMPARISON_CARD: ComponentDefinition = {
  name: 'comparison_card',
  display_name: 'Comparison Card',
  is_nestable: true,
  is_root: false,
  schema: {
    tone: {
      type: 'option',
      default_value: 'neutral',
      pos: 0,
      options: [
        { name: 'Positive', value: 'positive' },
        { name: 'Negative', value: 'negative' },
        { name: 'Neutral', value: 'neutral' },
      ],
    },
    heading: { type: 'text', pos: 1 },
    body: { type: 'richtext', pos: 2 },
  },
};

// Field order MUST match the ComparisonBlok interface (title, then columns).
const COMPARISON: ComponentDefinition = {
  name: 'comparison',
  display_name: 'Comparison',
  is_nestable: true,
  is_root: false,
  schema: {
    title: { type: 'text', pos: 0 },
    columns: {
      type: 'bloks',
      restrict_components: true,
      component_whitelist: ['comparison_card'],
      pos: 1,
    },
  },
};

function requireEnv(): { token: string; spaceId: string } {
  if (!MANAGEMENT_TOKEN || !SPACE_ID) {
    console.error(
      'Missing env. Set STORYBLOK_MANAGEMENT_TOKEN and STORYBLOK_SPACE_ID.\n' +
        '(Do NOT commit the token or add it as a CI secret — it is space-wide write access.)'
    );
    process.exit(1);
  }
  return { token: MANAGEMENT_TOKEN, spaceId: SPACE_ID };
}

async function listComponents(token: string, spaceId: string): Promise<StoryblokComponent[]> {
  const res = await fetch(`${API_BASE}/spaces/${spaceId}/components`, {
    headers: { Authorization: token },
  });
  if (!res.ok) {
    throw new Error(`Failed to list components: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { components?: StoryblokComponent[] };
  return data.components ?? [];
}

async function createComponent(
  token: string,
  spaceId: string,
  component: ComponentDefinition
): Promise<void> {
  const res = await fetch(`${API_BASE}/spaces/${spaceId}/components`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ component }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create "${component.name}": ${res.status} ${res.statusText} — ${body}`);
  }
}

async function updateComponent(
  token: string,
  spaceId: string,
  component: StoryblokComponent
): Promise<void> {
  const res = await fetch(`${API_BASE}/spaces/${spaceId}/components/${component.id}`, {
    method: 'PUT',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ component }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to update "${component.name}": ${res.status} ${res.statusText} — ${body}`);
  }
}

/**
 * Make `comparison` insertable in the `post` body, additively.
 *
 * If the `post.body` bloks field restricts components, MERGE `comparison` into
 * its whitelist (spreads the whole component so no other field/whitelist entry
 * is dropped). No-ops when the field already allows it, allows every component,
 * restricts by tag instead, or can't be found — each path logs why, so a run
 * against an unexpected space shape never silently claims success.
 */
async function ensurePostAllowsComparison(
  token: string,
  spaceId: string,
  components: StoryblokComponent[]
): Promise<void> {
  const post = components.find((c) => c.name === POST_COMPONENT);
  if (!post) {
    console.warn(`⚠ "${POST_COMPONENT}" component not found — skipped body whitelist patch.`);
    return;
  }

  const body = post.schema?.body;
  if (!body || body.type !== 'bloks') {
    const bloksFields = Object.entries(post.schema ?? {})
      .filter(([, field]) => field.type === 'bloks')
      .map(([key]) => key);
    console.warn(
      `⚠ "${POST_COMPONENT}.body" is not a bloks field. Bloks fields present: ` +
        `${bloksFields.join(', ') || '(none)'}. Skipped — set the real field key in this script.`
    );
    return;
  }

  if (!body.restrict_components) {
    console.log(`↷ "${POST_COMPONENT}.body" allows all components — no whitelist change needed.`);
    return;
  }

  // Only a plain component whitelist is patchable here. Tag restriction (or any
  // future restrict_type) needs a different change — warn, don't silently guess.
  if (body.restrict_type && body.restrict_type !== 'components') {
    console.warn(
      `⚠ "${POST_COMPONENT}.body" uses restrict_type "${body.restrict_type}", not a component whitelist. ` +
        `For tag restriction, tag the "${COMPARISON_NAME}" component in Storyblok instead. Skipped.`
    );
    return;
  }

  const whitelist = Array.isArray(body.component_whitelist) ? [...body.component_whitelist] : [];
  if (whitelist.includes(COMPARISON_NAME)) {
    console.log(`↷ "${COMPARISON_NAME}" already whitelisted in "${POST_COMPONENT}.body".`);
    return;
  }

  whitelist.push(COMPARISON_NAME);
  const updated: StoryblokComponent = {
    ...post,
    schema: { ...post.schema, body: { ...body, component_whitelist: whitelist } },
  };
  await updateComponent(token, spaceId, updated);
  console.log(`✔ added "${COMPARISON_NAME}" to "${POST_COMPONENT}.body" whitelist [${whitelist.join(', ')}]`);
}

// Atomic block-library folder each component belongs in. Mirrors the space's
// convention (parent container → molecules, child item → atoms, exactly like
// code_tabs → molecules / code_tab → atoms). Resolved to a group UUID at runtime
// since UUIDs are space-specific.
const COMPONENT_GROUPS: Record<string, string> = {
  comparison: 'molecules',
  comparison_card: 'atoms',
};

interface StoryblokComponentGroup {
  id: number;
  name: string;
  uuid: string;
}

async function listComponentGroups(
  token: string,
  spaceId: string
): Promise<StoryblokComponentGroup[]> {
  const res = await fetch(`${API_BASE}/spaces/${spaceId}/component_groups`, {
    headers: { Authorization: token },
  });
  if (!res.ok) {
    throw new Error(`Failed to list component groups: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { component_groups?: StoryblokComponentGroup[] };
  return data.component_groups ?? [];
}

async function createComponentGroup(
  token: string,
  spaceId: string,
  name: string
): Promise<StoryblokComponentGroup> {
  const res = await fetch(`${API_BASE}/spaces/${spaceId}/component_groups`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ component_group: { name } }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create group "${name}": ${res.status} ${res.statusText} — ${body}`);
  }
  const data = (await res.json()) as { component_group: StoryblokComponentGroup };
  return data.component_group;
}

/**
 * File each component under its atomic block-library folder (see COMPONENT_GROUPS).
 * Resolves the group by name — creating it if the space lacks it — then PUTs the
 * component only when its component_group_uuid is not already the target, so
 * re-runs are no-ops.
 */
async function ensureComponentGroups(
  token: string,
  spaceId: string,
  components: StoryblokComponent[]
): Promise<void> {
  const groups = await listComponentGroups(token, spaceId);
  const groupByName = new Map(groups.map((g) => [g.name.toLowerCase(), g]));

  for (const [componentName, groupName] of Object.entries(COMPONENT_GROUPS)) {
    const component = components.find((c) => c.name === componentName);
    if (!component) {
      console.warn(`⚠ "${componentName}" not found — skipped folder assignment.`);
      continue;
    }

    let group = groupByName.get(groupName.toLowerCase());
    if (!group) {
      group = await createComponentGroup(token, spaceId, groupName);
      groupByName.set(groupName.toLowerCase(), group);
      console.log(`✔ created folder "${groupName}"`);
    }

    if (component.component_group_uuid === group.uuid) {
      console.log(`↷ "${componentName}" already in "${groupName}" folder.`);
      continue;
    }
    await updateComponent(token, spaceId, { ...component, component_group_uuid: group.uuid });
    console.log(`✔ filed "${componentName}" under "${groupName}" folder`);
  }
}

async function main(): Promise<void> {
  const { token, spaceId } = requireEnv();
  const components = await listComponents(token, spaceId);
  const existing = new Set(components.map((c) => c.name));

  // Create comparison_card first — comparison whitelists it.
  for (const component of [COMPARISON_CARD, COMPARISON]) {
    if (existing.has(component.name)) {
      console.log(`↷ skipped "${component.name}" (already exists)`);
      continue;
    }
    await createComponent(token, spaceId, component);
    console.log(`✔ created "${component.name}"`);
  }

  // Re-fetch so just-created components (with ids + group uuids) are current for
  // folder assignment and the body whitelist patch.
  const current = await listComponents(token, spaceId);

  // File comparison/comparison_card under their atomic folders (idempotent).
  await ensureComponentGroups(token, spaceId, current);

  // Make comparison insertable in the post body (additive, idempotent).
  await ensurePostAllowsComparison(token, spaceId, current);

  console.log('Done.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

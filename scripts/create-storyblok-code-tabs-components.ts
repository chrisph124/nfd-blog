/**
 * Provision CMS-authored `code_tabs` in a Storyblok space:
 *   1. create the `code_tab` and `code_tabs` component schemas, and
 *   2. add `code_tabs` to the `post` body field so editors can insert it
 *      alongside markdown/richtext.
 *
 * One-time, LOCAL operation. Run by a human with a Management API token:
 *
 *   STORYBLOK_MANAGEMENT_TOKEN=xxx STORYBLOK_SPACE_ID=123456 \
 *     pnpm tsx scripts/create-storyblok-code-tabs-components.ts
 *
 * Idempotent: existing components are skipped (not overwritten) and the body
 * whitelist is merged (never replaced), so re-runs are safe.
 *
 * SECURITY: the Management token is write-scoped to the ENTIRE space. Treat it
 * as a secret — env/.env only (gitignored), never logged, and NEVER added as a
 * GitHub Actions / CI secret (unlike the read-only content token in ci.yml).
 */
import 'dotenv/config';

const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;
const SPACE_ID = process.env.STORYBLOK_SPACE_ID;
// EU is the default Management API host (matches apiOptions.region: 'eu').
const API_BASE = process.env.STORYBLOK_MANAGEMENT_API_URL ?? 'https://mapi.storyblok.com/v1';

// Content type + field the code_tabs blok is made insertable in.
const POST_COMPONENT = 'post';
const CODE_TABS_NAME = 'code_tabs';

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
  [key: string]: unknown;
}

const CODE_TAB: ComponentDefinition = {
  name: 'code_tab',
  display_name: 'Code Tab',
  is_nestable: true,
  is_root: false,
  schema: {
    label: { type: 'text', required: true, pos: 0 },
    language: { type: 'text', default_value: 'bash', pos: 1 },
    code: { type: 'textarea', required: true, pos: 2 },
    // Optional Astro-style filename shown in the tab's header bar (CodeTabsClient).
    filename: { type: 'text', pos: 3 },
  },
};

const CODE_TABS: ComponentDefinition = {
  name: 'code_tabs',
  display_name: 'Code Tabs',
  is_nestable: true,
  is_root: false,
  schema: {
    tabs: {
      type: 'bloks',
      restrict_components: true,
      component_whitelist: ['code_tab'],
      pos: 0,
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
 * Make `code_tabs` insertable in the `post` body, additively.
 *
 * If the `post.body` bloks field restricts components, MERGE `code_tabs` into
 * its whitelist (spreads the whole component so no other field/whitelist entry
 * is dropped). No-ops when the field already allows it, allows every component,
 * restricts by tag instead, or can't be found — each path logs why, so a run
 * against an unexpected space shape never silently claims success.
 */
async function ensurePostAllowsCodeTabs(
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
        `For tag restriction, tag the "${CODE_TABS_NAME}" component in Storyblok instead. Skipped.`
    );
    return;
  }

  const whitelist = Array.isArray(body.component_whitelist) ? [...body.component_whitelist] : [];
  if (whitelist.includes(CODE_TABS_NAME)) {
    console.log(`↷ "${CODE_TABS_NAME}" already whitelisted in "${POST_COMPONENT}.body".`);
    return;
  }

  whitelist.push(CODE_TABS_NAME);
  const updated: StoryblokComponent = {
    ...post,
    schema: { ...post.schema, body: { ...body, component_whitelist: whitelist } },
  };
  await updateComponent(token, spaceId, updated);
  console.log(`✔ added "${CODE_TABS_NAME}" to "${POST_COMPONENT}.body" whitelist [${whitelist.join(', ')}]`);
}

async function main(): Promise<void> {
  const { token, spaceId } = requireEnv();
  const components = await listComponents(token, spaceId);
  const existing = new Set(components.map((c) => c.name));

  // Create code_tab first — code_tabs whitelists it.
  for (const component of [CODE_TAB, CODE_TABS]) {
    if (existing.has(component.name)) {
      console.log(`↷ skipped "${component.name}" (already exists)`);
      continue;
    }
    await createComponent(token, spaceId, component);
    console.log(`✔ created "${component.name}"`);
  }

  // Make code_tabs insertable in the post body (additive, idempotent).
  await ensurePostAllowsCodeTabs(token, spaceId, components);

  console.log('Done.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

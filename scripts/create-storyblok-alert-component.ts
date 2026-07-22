/**
 * Provision the CMS-authored `alert` component in a Storyblok space:
 *   1. create the `alert` component schema, and
 *   2. add `alert` to the `post` body field so editors can insert it alongside
 *      markdown/richtext/code_tabs.
 *
 * One-time, LOCAL operation. Run by a human with a Management API token. The
 * create-storyblok-* scripts load `dotenv/config` (reads `.env`), while
 * `generate-types` targets `.env.local` — so point this script at `.env.local`:
 *
 *   DOTENV_CONFIG_PATH=.env.local \
 *     pnpm tsx scripts/create-storyblok-alert-component.ts
 *   # or inline:
 *   STORYBLOK_MANAGEMENT_TOKEN=xxx STORYBLOK_SPACE_ID=123456 \
 *     pnpm tsx scripts/create-storyblok-alert-component.ts
 *
 * Idempotent: an existing `alert` component is skipped (not overwritten) and the
 * body whitelist is merged (never replaced), so re-runs are safe.
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

// Content type + field the alert blok is made insertable in.
const POST_COMPONENT = 'post';
const ALERT_NAME = 'alert';

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

// Field order + option values MUST match the AlertBlok interface in
// src/types/storyblok.ts so `generate-types` reproduces it with no diff.
const ALERT: ComponentDefinition = {
  name: 'alert',
  display_name: 'Alert',
  is_nestable: true,
  is_root: false,
  schema: {
    icon: {
      type: 'option',
      default_value: 'information',
      pos: 0,
      options: [
        { name: 'Information', value: 'information' },
        { name: 'Attention', value: 'attention' },
        { name: 'Checked', value: 'checked' },
      ],
    },
    color: {
      // 5 brand-accent options — white/black dropped in validation (Session 1)
      // to avoid a low-contrast foot-gun on the transparent alert.
      type: 'option',
      default_value: 'emerald',
      pos: 1,
      options: [
        { name: 'Emerald', value: 'emerald' },
        { name: 'Primary', value: 'primary' },
        { name: 'Secondary', value: 'secondary' },
        { name: 'Cyan', value: 'cyan' },
        { name: 'Magenta', value: 'magenta' },
      ],
    },
    title: { type: 'text', default_value: 'TL;DR', pos: 2 },
    body: { type: 'richtext', pos: 3 },
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
 * Make `alert` insertable in the `post` body, additively.
 *
 * If the `post.body` bloks field restricts components, MERGE `alert` into its
 * whitelist (spreads the whole component so no other field/whitelist entry is
 * dropped). No-ops when the field already allows it, allows every component,
 * restricts by tag instead, or can't be found — each path logs why, so a run
 * against an unexpected space shape never silently claims success.
 */
async function ensurePostAllowsAlert(
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
        `For tag restriction, tag the "${ALERT_NAME}" component in Storyblok instead. Skipped.`
    );
    return;
  }

  const whitelist = Array.isArray(body.component_whitelist) ? [...body.component_whitelist] : [];
  if (whitelist.includes(ALERT_NAME)) {
    console.log(`↷ "${ALERT_NAME}" already whitelisted in "${POST_COMPONENT}.body".`);
    return;
  }

  whitelist.push(ALERT_NAME);
  const updated: StoryblokComponent = {
    ...post,
    schema: { ...post.schema, body: { ...body, component_whitelist: whitelist } },
  };
  await updateComponent(token, spaceId, updated);
  console.log(`✔ added "${ALERT_NAME}" to "${POST_COMPONENT}.body" whitelist [${whitelist.join(', ')}]`);
}

async function main(): Promise<void> {
  const { token, spaceId } = requireEnv();
  const components = await listComponents(token, spaceId);
  const existing = new Set(components.map((c) => c.name));

  if (existing.has(ALERT.name)) {
    console.log(`↷ skipped "${ALERT.name}" (already exists)`);
  } else {
    await createComponent(token, spaceId, ALERT);
    console.log(`✔ created "${ALERT.name}"`);
  }

  // Make alert insertable in the post body (additive, idempotent).
  await ensurePostAllowsAlert(token, spaceId, components);

  console.log('Done.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

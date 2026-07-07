/**
 * Create the `code_tab` and `code_tabs` component schemas in a Storyblok space.
 *
 * One-time, LOCAL operation. Run by a human with a Management API token:
 *
 *   STORYBLOK_MANAGEMENT_TOKEN=xxx STORYBLOK_SPACE_ID=123456 \
 *     pnpm tsx scripts/create-storyblok-code-tabs-components.ts
 *
 * Idempotent: existing components are skipped, not overwritten.
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

interface ComponentDefinition {
  name: string;
  display_name: string;
  is_nestable: boolean;
  is_root: boolean;
  schema: Record<string, unknown>;
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

async function listComponentNames(token: string, spaceId: string): Promise<Set<string>> {
  const res = await fetch(`${API_BASE}/spaces/${spaceId}/components`, {
    headers: { Authorization: token },
  });
  if (!res.ok) {
    throw new Error(`Failed to list components: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { components?: Array<{ name: string }> };
  return new Set((data.components ?? []).map((c) => c.name));
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

async function main(): Promise<void> {
  const { token, spaceId } = requireEnv();
  const existing = await listComponentNames(token, spaceId);

  // Create code_tab first — code_tabs whitelists it.
  for (const component of [CODE_TAB, CODE_TABS]) {
    if (existing.has(component.name)) {
      console.log(`↷ skipped "${component.name}" (already exists)`);
      continue;
    }
    await createComponent(token, spaceId, component);
    console.log(`✔ created "${component.name}"`);
  }

  console.log('Done.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

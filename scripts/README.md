# Type Generation Script

This script automatically generates TypeScript types from your Storyblok component schemas.

## Setup

1. **Get your Storyblok credentials:**
   - Go to Storyblok → Settings → Access Tokens
   - Create a **Management Token** (not Content Delivery token)
   - Find your **Space ID** in Settings → General

2. **Add to `.env.local`:**
   ```bash
   STORYBLOK_MANAGEMENT_TOKEN=your_management_token_here
   STORYBLOK_SPACE_ID=your_space_id_here
   ```

   Note: The script uses `dotenv` (already installed) to load these variables.

## Provisioning the `code_tabs` components

`create-storyblok-code-tabs-components.ts` is a one-time, local setup step that
makes CMS-authored code tabs usable. It (1) creates the `code_tab` and
`code_tabs` component schemas and (2) adds `code_tabs` to the `post` body field
so editors can insert it alongside markdown/richtext.

Uses the same `STORYBLOK_MANAGEMENT_TOKEN` + `STORYBLOK_SPACE_ID` as above:

```bash
STORYBLOK_MANAGEMENT_TOKEN=xxx STORYBLOK_SPACE_ID=123456 \
  pnpm tsx scripts/create-storyblok-code-tabs-components.ts
```

- **Idempotent & additive:** existing components are skipped and the body
  whitelist is merged (never replaced), so re-runs are safe.
- After it succeeds, run `npm run generate-types` to sync the new/updated
  schema into `src/types/storyblok.ts`.
- **Security:** the Management token is space-wide write access — keep it in
  `.env.local` only, never commit it, and never add it as a CI secret.

## Usage

Run the script whenever you create or update components in Storyblok:

```bash
npm run generate-types
```

This will:
1. Fetch all component schemas from Storyblok Management API
2. Generate TypeScript interfaces for each component
3. Update `src/types/storyblok.ts` with the new types
4. Display a summary of generated types

## Example

If you have a component called `article` with fields:
- `title` (text, required)
- `content` (richtext)
- `author` (text)
- `published` (boolean)

The script will generate:

```typescript
/**
 * article component
 */
export interface ArticleBlok extends StoryblokBlok {
  component: 'article';
  title: string;
  content?: string;
  author?: string;
  published?: boolean;
}
```

## Supported Field Types

The script maps Storyblok field types to TypeScript:

- `text`, `textarea`, `richtext`, `markdown` → `string`
- `number` → `number`
- `boolean` → `boolean`
- `asset` → `StoryblokAsset`
- `multiasset` → `StoryblokAsset[]`
- `multilink` → `StoryblokLink`
- `option` → Union of option values (e.g., `'draft' | 'published'`)
- `options` → `string[]`
- `bloks` → Array of component types (e.g., `(FeatureBlok | GridBlok)[]`)
- `block` → Single component type
- Unknown types → `unknown` (never uses `any`)

## Generated Types

The output file (`src/types/storyblok.ts`) includes:

1. **Base Types**: `StoryblokBlok`, `StoryblokAsset`, `StoryblokLink`
2. **Component Interfaces**: One for each Storyblok component
3. **Utility Types**:
   - `AnyBlok` - Union of all component types
   - `StoryblokComponentProps<T>` - Generic props interface
   - `StoryblokStory<T>` - Story data structure
   - `StoryblokResponse<T>` - API response structure

## Notes

- Component names are converted to PascalCase (e.g., `nav_item` → `NavItemBlok`)
- Required fields have no `?` modifier; optional fields do
- Nested components are properly typed based on `component_whitelist`
- The script follows the project rule: never uses `any` type, only `unknown` or `never`
- All base types are preserved across regenerations

---

# Tag Taxonomy Retag Migration (Phase 4)

Converts the free-typed `tag_list` values across `post` stories into a clean,
canonical set (Title-Case display names that each produce a **unique** URL slug)
so the SEO tag archive (`/tags`, `/tags/<slug>`) has no casing/whitespace/merge
variants. This is a **one-time, human-driven, approval-gated** data migration —
not part of the app build.

Three scripts, one shared pure module:

| File | Writes? | Purpose |
|------|---------|---------|
| `lib/tag-taxonomy.ts` | — | Pure helpers (`slugify`, collision + mapping logic). No I/O. Kept byte-for-byte in parity with the runtime `src/lib/tags.ts` `slugify` by `src/__tests__/scripts/tag-taxonomy-parity.test.ts`. |
| `verify-tag-slugs.ts` | No (read-only) | Ship-gate: re-pulls live **published** `cdn/tags` and fails non-zero if any two names collapse to one slug. Uses the read-only `STORYBLOK_TOKEN`. |
| `retag-storyblok.ts` | Only in `apply --yes` | The migration itself: `plan` (read-only diff) → `backup` (local dumps) → `apply --yes` (GET → mutate only `tag_list` → PUT+publish). Uses the space-wide `STORYBLOK_MANAGEMENT_TOKEN`. |

## Why a rewrite-and-republish (not a "rename tag")

Storyblok has **no** global "rename tag" operation — a tag is just a string held
in each story's `tag_list`. A merge/rename therefore means rewriting and
republishing every affected story. To avoid clobbering body content, the script
does a full **GET → mutate only `tag_list` → PUT the complete story payload with
`publish: 1`** (never a partial body), and the first write is asserted
content-byte-identical (pilot) before the rest proceed.

## Prerequisites

Add to `.env.local` (same credentials as the provisioning scripts above):

```bash
STORYBLOK_MANAGEMENT_TOKEN=your_management_token_here   # space-wide WRITE access
STORYBLOK_SPACE_ID=your_space_id_here
STORYBLOK_TOKEN=your_content_delivery_token_here        # read-only, for the ship-gate
```

**Security:** `STORYBLOK_MANAGEMENT_TOKEN` grants space-wide write access. Keep
it in `.env.local` only — never log it, never commit it, never add it as a CI
secret. All commands below load it via `DOTENV_CONFIG_PATH=.env.local`.

## The mapping file

`tag-mapping.json` (git-ignored) maps **old display name → new canonical display
name**. Merges are expressed as several keys sharing one value; a canonical name
mapping to itself keeps the run idempotent:

```json
{
  "roi": "ROI",
  "ROI": "ROI",
  "AgenticAI": "AI Agents",
  "ai-agents": "AI Agents"
}
```

Start from the template and fill it from the **live `plan` output** (never guess
the live tag set):

```bash
cp scripts/tag-mapping.example.json scripts/tag-mapping.json
```

The script **rejects** any mapping whose target names collide on slug (two
distinct canonical names → one slug), so the runtime never has to fail-open.

> **Known slug caveat — `CI/CD`.** `slugify` strips `/` (it is not a word/space
> separator), so `slugify("CI/CD") === "cicd"`. To land the slug `ci-cd`, the
> canonical display name must be `CI CD` or `CI-CD` (both slugify to `ci-cd`).
> Decide the display form at the approval gate before filling the mapping.

## Run order (each step is gated)

```bash
# 1. Preview — READ-ONLY. Prints live tags, old→new arrows, target slugs, and a
#    per-story before→after tag_list diff. No writes anywhere.
DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/retag-storyblok.ts plan

# 2. Backup — dumps every affected story's FULL JSON + manifest.json to
#    scripts/.tag-backup/ (git-ignored). Read-only on Storyblok.
DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/retag-storyblok.ts backup

#    Prove restorability once: PUT a single backed-up story back and confirm its
#    content is byte-identical before trusting the bulk.

# 3a. Pilot — apply to ONE tag's stories first. Refuses without a backup manifest,
#     a clean drift re-check, and --yes. Halts if the pilot write is not
#     tag_list-only.
DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/retag-storyblok.ts apply --pilot ROI --yes

# 3b. Full apply — the rest.
DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/retag-storyblok.ts apply --yes

# 4. Verify — re-pull live published tags; must report a unique slug per tag.
DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/verify-tag-slugs.ts
```

Useful flags: `--mapping <path>` (default `scripts/tag-mapping.json`),
`--backup-dir <path>` (default `scripts/.tag-backup`), `--limit <n>` (cap
stories for a smoke run), `--pilot <tagName>` (restrict to stories carrying that
tag).

## Safety invariants (built into the scripts)

- `plan` and `backup` never write to Storyblok; `apply` writes only with `--yes`.
- `apply` refuses without a backup manifest **and** a clean pre-flight drift
  check (every renamed source tag must still be live — re-`plan` if not).
- Writes send the complete story payload with only `tag_list` changed; the pilot
  proves the write is `tag_list`-only before the bulk continues.
- During the bulk window, **defer the publish webhook** and fire one manual
  `/api/revalidate` afterward, then re-enable the webhook.
- `scripts/.tag-backup/` and `scripts/tag-mapping.json` are git-ignored (they
  hold story content and space-specific data).

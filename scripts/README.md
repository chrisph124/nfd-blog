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

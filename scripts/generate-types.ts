/**
 * Script to fetch Storyblok component schemas and generate TypeScript types
 *
 * Usage:
 * 1. Set STORYBLOK_MANAGEMENT_TOKEN in .env.local
 * 2. Run: npm run generate-types
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

interface StoryblokFieldOption {
  value: string;
  name: string;
}

interface StoryblokField {
  type: string;
  required?: boolean;
  options?: StoryblokFieldOption[];
  component_whitelist?: string[];
  restrict_components?: boolean;
}

interface StoryblokComponent {
  name: string;
  schema: Record<string, StoryblokField>;
  is_root?: boolean;
  is_nestable?: boolean;
}

const STORYBLOK_MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;
const STORYBLOK_SPACE_ID = process.env.STORYBLOK_SPACE_ID;

if (!STORYBLOK_MANAGEMENT_TOKEN) {
  console.error('❌ STORYBLOK_MANAGEMENT_TOKEN is required in .env.local');
  process.exit(1);
}

if (!STORYBLOK_SPACE_ID) {
  console.error('❌ STORYBLOK_SPACE_ID is required in .env.local');
  process.exit(1);
}

// Map Storyblok field types to TypeScript types
function mapFieldToTypeScript(fieldName: string, field: StoryblokField): string {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'richtext':
    case 'markdown':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'asset':
      return 'StoryblokAsset';
    case 'multiasset':
      return 'StoryblokAsset[]';
    case 'multilink':
      return 'StoryblokLink';
    case 'option':
      if (field.options && field.options.length > 0) {
        return field.options.map((opt) => `'${opt.value}'`).join(' | ');
      }
      return 'string';
    case 'options':
      return 'string[]';
    case 'bloks':
      if (field.component_whitelist && field.component_whitelist.length > 0) {
        const types = field.component_whitelist.map(comp =>
          `${pascalCase(comp)}Blok`
        ).join(' | ');
        return `(${types})[]`;
      }
      return 'StoryblokBlok[]';
    case 'block':
      if (field.component_whitelist && field.component_whitelist.length > 0) {
        return field.component_whitelist.map(comp =>
          `${pascalCase(comp)}Blok`
        ).join(' | ');
      }
      return 'StoryblokBlok';
    default:
      // For unknown field types, use unknown instead of any
      console.warn(`⚠️  Unknown field type "${field.type}" for field "${fieldName}", using "unknown"`);
      return 'unknown';
  }
}

// Convert snake_case to PascalCase
function pascalCase(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Generate TypeScript interface for a component
function generateInterface(component: StoryblokComponent): string {
  const interfaceName = `${pascalCase(component.name)}Blok`;
  const fields = Object.entries(component.schema).map(([fieldName, field]) => {
    const tsType = mapFieldToTypeScript(fieldName, field);
    const optional = field.required ? '' : '?';
    return `  ${fieldName}${optional}: ${tsType};`;
  });

  return `
/**
 * ${component.name} component
 */
export interface ${interfaceName} extends StoryblokBlok {
  component: '${component.name}';
${fields.join('\n')}
}`;
}

async function fetchComponents(): Promise<StoryblokComponent[]> {
  const response = await fetch(
    `https://mapi.storyblok.com/v1/spaces/${STORYBLOK_SPACE_ID}/components`,
    {
      headers: {
        'Authorization': STORYBLOK_MANAGEMENT_TOKEN!,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch components: ${response.statusText}`);
  }

  const data = await response.json();
  return data.components;
}

async function generateTypes() {
  console.log('🔄 Fetching components from Storyblok...');

  try {
    const components = await fetchComponents();
    console.log(`✅ Found ${components.length} components`);

    // Generate interfaces
    const interfaces = components.map(generateInterface).join('\n');

    // Generate union type for all bloks
    const allBlokTypes = components.map(comp =>
      `${pascalCase(comp.name)}Blok`
    ).join('\n  | ');

    const fileContent = `import { SbBlokData } from "@storyblok/react/rsc";

// ============================================================================
// Base Storyblok Types
// ============================================================================

/**
 * Base interface for all Storyblok bloks
 * Extends SbBlokData which includes _uid and component
 */
export interface StoryblokBlok extends SbBlokData {
  _uid: string;
  component: string;
  _editable?: string;
}

/**
 * Storyblok Asset (images, videos, etc.)
 */
export interface StoryblokAsset {
  id: number;
  filename: string;
  alt?: string;
  title?: string;
  focus?: string;
  name?: string;
  copyright?: string;
}

/**
 * Storyblok Link
 */
export interface StoryblokLink {
  id?: string;
  url?: string;
  linktype?: 'url' | 'story' | 'asset' | 'email';
  fieldtype?: 'multilink';
  cached_url?: string;
  anchor?: string;
  target?: '_self' | '_blank';
  story?: {
    id: number;
    name: string;
    slug: string;
    full_slug: string;
  };
}

// ============================================================================
// Component-Specific Blok Types (Auto-generated)
// ============================================================================
${interfaces}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Generic Storyblok Component Props
 */
export interface StoryblokComponentProps<T extends StoryblokBlok = StoryblokBlok> {
  blok: T;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Union of all blok types
 */
export type AnyBlok =
  | ${allBlokTypes};

/**
 * Storyblok Story Link (for links API)
 */
export interface StoryblokStoryLink {
  id: number;
  slug: string;
  name: string;
  is_folder: boolean;
  parent_id: number | null;
  published: boolean;
  position: number;
  uuid: string;
  is_startpage: boolean;
}

export interface StoryblokLinksResponse {
  links: Record<string, StoryblokStoryLink>;
}

/**
 * Storyblok Story
 */
export interface StoryblokStory<Content = StoryblokBlok> {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  created_at: string;
  published_at: string | null;
  first_published_at: string | null;
  content: Content;
  position: number;
  tag_list: string[];
  is_startpage: boolean;
  parent_id: number | null;
  meta_data: Record<string, unknown> | null;
  group_id: string;
  release_id: number | null;
  lang: string;
  path: string;
  alternates: Array<{
    id: number;
    name: string;
    slug: string;
    full_slug: string;
    is_folder: boolean;
    parent_id: number;
  }>;
  default_full_slug: string | null;
  translated_slugs: Array<{
    lang: string;
    name: string;
    path: string;
  }> | null;
}

/**
 * Storyblok API Response
 */
export interface StoryblokResponse<T = StoryblokBlok> {
  data: {
    story: StoryblokStory<T>;
  };
}
`;

    // Write to file
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, '../src/types/storyblok.ts');

    fs.writeFileSync(outputPath, fileContent);
    console.log(`✅ Types generated successfully at ${outputPath}`);
    console.log('\n📝 Generated types for components:');
    components.forEach(comp => {
      console.log(`  - ${comp.name} → ${pascalCase(comp.name)}Blok`);
    });
  } catch (error) {
    console.error('❌ Error generating types:', error);
    process.exit(1);
  }
}

generateTypes();

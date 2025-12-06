import type { StoryblokRichTextNode } from '@storyblok/react/rsc';

// ============================================================================
// RichText Node Types
// ============================================================================

/**
 * RichText text node
 */
export interface RichTextNode {
  type: 'text';
  text: string;
  marks?: unknown[];
}

/**
 * RichText element node
 */
export interface RichTextElementNode {
  type: string;
  content?: (RichTextNode | RichTextElementNode)[];
  attrs?: Record<string, unknown>;
  marks?: unknown[];
}

// ============================================================================
// Next.js Component Mock Types
// ============================================================================

/**
 * Mock Image component props for testing
 */
export interface MockImageProps {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  unoptimized?: boolean;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  className?: string;
  [key: string]: unknown;
}

/**
 * Mock Link component props for testing
 */
export interface MockLinkProps {
  href?: string;
  children?: React.ReactNode;
  target?: string;
  rel?: string;
  className?: string;
  [key: string]: unknown;
}

// ============================================================================
// Storyblok Function Mock Types
// ============================================================================

/**
 * Storyblok editable function signature
 */
export interface StoryblokEditableProps {
  _uid: string;
  component?: string;
  _editable?: string;
  [key: string]: unknown;
}

export type StoryblokEditableFunction = <T extends StoryblokEditableProps>(blok: T) => T;

/**
 * Storyblok renderRichText function signature
 */
export type RenderRichTextFunction = (content: StoryblokRichTextNode<string> | null | undefined) => string | null;

// ============================================================================
// Storyblok API Types
// ============================================================================

/**
 * Storyblok API instance for testing
 */
export interface StoryblokApiInstance {
  get(endpoint: string, options?: GetStoryblokApiOptions): Promise<unknown>;
}

/**
 * Storyblok API options for testing
 */
export interface GetStoryblokApiOptions {
  version?: 'draft' | 'published';
  find_by?: 'uuid';
  [key: string]: unknown;
}

// ============================================================================
// Mock Factory Functions
// ============================================================================

/**
 * Creates a mock Next.js Image component
 */
export function createMockImage() {
  return function MockImage({ src, alt, ...props }: MockImageProps) {
    // Return a simple img element for testing
    return {
      type: 'img',
      props: {
        src,
        alt: alt || '',
        ...props,
      },
    };
  };
}

/**
 * Creates a mock Next.js Link component
 */
export function createMockLink() {
  return function MockLink({ href, children, target, rel, ...props }: MockLinkProps) {
    // Return a simple anchor element for testing
    return {
      type: 'a',
      props: {
        href: href || '#',
        target: target || '_self',
        rel: rel || '',
        children,
        ...props,
      },
    };
  };
}

/**
 * Creates a mock storyblokEditable function
 */
export function createStoryblokEditable(): StoryblokEditableFunction {
  return function mockStoryblokEditable<T extends StoryblokEditableProps>(blok: T): T {
    return {
      ...blok,
      'data-blok-cuid': blok._uid,
      'data-blok-uid': blok._uid,
    };
  };
}

/**
 * Creates a mock renderRichText function
 */
export function createRenderRichText(): RenderRichTextFunction {
  return function mockRenderRichText(content: StoryblokRichTextNode<string> | null | undefined): string | null {
    if (!content) return null;
    if (typeof content === 'object' && content !== null) {
      // Simulate rich text rendering
      return '<p>Mock rich text content</p>';
    }
    return String(content);
  };
}

// All types are already exported with their declarations
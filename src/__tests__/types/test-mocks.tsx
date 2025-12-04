import React from 'react';
import { vi } from 'vitest';
import { type StoryblokRichTextNode } from '@storyblok/react/rsc';
import Image from 'next/image';

/**
 * Test Mock Interfaces
 *
 * This file contains TypeScript interfaces for mocking external dependencies
 * in unit tests, providing type safety and better IDE support.
 *
 * These interfaces follow Next.js and Storyblok patterns to ensure
 * compatibility with real component signatures.
 */

// ============================================================================
// Next.js Component Mock Interfaces
// ============================================================================

/**
 * Mock Next.js Image component props
 * Follows Next.js Image component API while allowing test overrides
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
  quality?: number;
  placeholder?: string;
  blur?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: 'static' | 'relative' | 'absolute' | 'fixed' | 'center' | 'top' | 'bottom' | 'left' | 'right';
  loading?: 'lazy' | 'eager';
  [key: string]: unknown;
}

/**
 * Mock Next.js Link component props
 * Handles internal navigation and external links properly
 */
export interface MockLinkProps {
  href?: string;
  children?: React.ReactNode;
  target?: '_self' | '_blank';
  rel?: string;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
  legacyBehavior?: boolean;
  [key: string]: unknown;
}

/**
 * Mock Next.js Head component props
 * Used in some tests for document head management
 */
export interface MockHeadProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

// ============================================================================
// Storyblok RichText Node Interfaces
// ============================================================================

/**
 * Storyblok RichText Text Node
 * Represents text content within a rich text document
 */
export interface RichTextNode {
  type: 'text';
  text: string;
  marks?: RichTextNodeMark[];
}

/**
 * Storyblok RichText Node Mark
 * Represents formatting applied to text nodes
 */
export interface RichTextNodeMark {
  type: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link' | 'styled';
  attrs?: Record<string, unknown>;
}

/**
 * Storyblok RichText Element Node
 * Represents structural elements in rich text
 */
export interface RichTextElementNode {
  type: 'paragraph' | 'heading' | 'heading_1' | 'heading_2' | 'heading_3' | 'heading_4' | 'heading_5' | 'heading_6' |
        'bullet_list' | 'ordered_list' | 'list_item' | 'blockquote' | 'code_block' | 'hard_break' |
        'horizontal_rule' | 'image' | 'emoji';
  content?: (RichTextNode | RichTextElementNode)[];
  attrs?: Record<string, unknown>;
}

/**
 * Storyblok RichText Document Node
 * Represents the root document structure
 */
export interface RichTextDocumentNode {
  type: 'doc';
  content?: (RichTextNode | RichTextElementNode)[];
}

/**
 * Union type for all RichText nodes
 */
export type RichTextContentNode = RichTextNode | RichTextElementNode | RichTextDocumentNode;

// ============================================================================
// Storyblok Mock Interfaces
// ============================================================================

/**
 * Storyblok editable props for visual editor integration
 * Matches the real storyblokEditable function signature
 */
export interface StoryblokEditableProps {
  _uid: string;
  _editable?: string;
  [key: string]: unknown;
}

/**
 * Storyblok renderRichText function props
 * Matches the real renderRichText function signature
 */
export interface RenderRichTextProps {
  content: StoryblokRichTextNode<string>;
  options?: {
    resolveRelations?: boolean;
    resolver?: (type: string, blok: Record<string, unknown>) => React.ReactNode;
    schema?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

/**
 * Storyblok getStoryblokApi function options
 * Matches the real getStoryblokApi function signature
 */
export interface GetStoryblokApiOptions {
  accessToken?: string;
  cache?: {
    clear?: boolean;
    version?: string | number;
  };
  apiOptions?: {
    region?: string;
    httpsAgent?: string;
    cors?: boolean;
  };
}

// ============================================================================
// Test Utility Interfaces
// ============================================================================

/**
 * Console spy interface for testing console methods
 * Provides type-safe mocking of console output
 */
export interface ConsoleSpy {
  log: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
  mockRestore: () => void;
}

/**
 * Storyblok API instance interface
 * Provides type-safe interface for Storyblok API
 */
export interface StoryblokApiInstance {
  init: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

/**
 * Network fetch mock interface for API testing
 * Provides type-safe mock for fetch operations
 */
export type NetworkFetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/**
 * Test execution context for mocking
 * Provides controlled environment for test execution
 */
export interface TestExecutionContext {
  /**
   * Mock console methods for testing
   */
  console: {
    log: ConsoleSpy['log'];
    warn: ConsoleSpy['warn'];
    error: ConsoleSpy['error'];
    info: ConsoleSpy['info'];
    debug: ConsoleSpy['debug'];
   };

   /**
   * Mock global fetch for API testing
   */
   fetch: NetworkFetchMock;

   /**
   * Clean up mocks after test
   */
   cleanup: () => void;
}

// ============================================================================
// Mock Creation Helper Functions
// ============================================================================

/**
 * Creates a typed mock Next.js Image component
 * Converts boolean props to strings for DOM compliance
 */
export function createMockImage(): React.FC<MockImageProps> {
  const MockImage = ({ src, alt, unoptimized = false, priority = false, fill = false, ...props }: MockImageProps) => {
    // For testing purposes, we use the real Image component with safe defaults
    return (
      <Image
        src={src || ''}
        alt={alt || 'Test image'}
        width={100}
        height={100}
        unoptimized={unoptimized}
        priority={priority}
        fill={fill}
        {...props}
      />
    );
  };

  return MockImage;
}

/**
 * Creates a typed mock Next.js Link component
 * Handles internal vs external links properly
 */
export function createMockLink(): React.FC<MockLinkProps> {
  const MockLink = ({ href, children, target = '_self', rel, ...props }: MockLinkProps) => {
    const isExternal = href?.startsWith('http') && target === '_blank';

    if (isExternal) {
      return (
        <a
          href={href}
          target={target}
          rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
          {...props}
        >
          {children}
        </a>
      );
    }

    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };

  return MockLink;
}

/**
 * Creates a typed storyblokEditable mock
 * Provides proper visual editor data attributes
 */
export function createStoryblokEditable(): (blok: Record<string, unknown>) => StoryblokEditableProps {
  return (blok: Record<string, unknown>) => ({
    _uid: blok._uid as string,
    _editable: blok._editable as string,
  });
}


/**
 * Creates a typed renderRichText mock
 * Handles Storyblok rich text content properly
 */
export function createRenderRichText() {
  return (content?: StoryblokRichTextNode<string> | StoryblokRichTextNode<string>[]): string => {
    if (!content) return '';

    // Simulate Storyblok rich text rendering
    // In real implementation, this would convert to HTML
    return '<p>Mock rich text content</p>';
  };
}

/**
 * Creates a typed getStoryblokApi mock
 * Provides proper Storyblok API initialization
 */
export function createMockGetStoryblokApi(): GetStoryblokApiOptions {
  return {
    accessToken: process.env.NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN,
    cache: { clear: false },
    apiOptions: { region: 'us-east-1', httpsAgent: undefined },
  };
}

/**
 * Creates a test execution context with typed mocks
 * Provides controlled environment for test execution
 */
export function createTestContext(): TestExecutionContext {
  const consoleSpies = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };

  return {
    console: consoleSpies,
    fetch: vi.fn(),
    cleanup: () => {
      Object.entries(consoleSpies).forEach(([method]) => {
        vi.spyOn(console, method as keyof Console).mockRestore();
      });
    },
  };
};

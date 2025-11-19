import { SbBlokData } from "@storyblok/react/rsc";

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

/**
 * content_block component
 */
export interface ContentBlockBlok extends StoryblokBlok {
  component: 'content_block';
  eyebrow?: string;
  title?: string;
  sub_title?: string;
  description?: string;
  first_cta?: StoryblokLink;
  second_cta?: StoryblokLink;
  media?: StoryblokAsset;
  background_image?: StoryblokAsset;
  content_alignment?: 'left' | 'center' | 'right';
  position?: 'vertical' | 'vertical-reverse' | 'horizontal' | 'horizontal-reverse';
}

/**
 * cta component
 */
export interface CtaBlok extends StoryblokBlok {
  component: 'cta';
  label?: string;
  navigate_to?: StoryblokLink;
  cta_type?: 'primary' | 'primary-reverse' | 'primary-outlined' | 'secondary' | 'secondary-reverse' | 'secondary-outlined' | 'link';
  cta_size?: 'hug' | 'large' | 'full';
}

/**
 * feature component
 */
export interface FeatureBlok extends StoryblokBlok {
  component: 'feature';
  name?: string;
}

/**
 * footer component
 */
export interface FooterBlok extends StoryblokBlok {
  component: 'footer';
  copyright?: string;
  footer_links?: StoryblokBlok[];
  social_media?: StoryblokBlok[];
}

/**
 * grid component
 */
export interface GridBlok extends StoryblokBlok {
  component: 'grid';
  columns?: StoryblokBlok[];
}

/**
 * header component
 */
export interface HeaderBlok extends StoryblokBlok {
  component: 'header';
  title?: string;
  logo?: StoryblokAsset;
  nav_items?: (NavItemBlok)[];
  enableTheme?: boolean;
  lang?: 'vi' | 'us';
}

/**
 * hero_block component
 */
export interface HeroBlockBlok extends StoryblokBlok {
  component: 'hero_block';
  background_image?: StoryblokAsset;
  eyebrow?: string;
  heading: string;
  heading_tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  sub_heading?: string;
  image?: StoryblokAsset;
  cta_group?: (CtaBlok)[];
  content_alignment?: 'left' | 'center' | 'right';
  position?: 'vertical' | 'vertical-reverse' | 'horizontal' | 'horizontal-reverse';
}

/**
 * nav_item component
 */
export interface NavItemBlok extends StoryblokBlok {
  component: 'nav_item';
  label: string;
  link?: StoryblokLink;
  sub_items?: (SubNavItemBlok)[];
  has_dropdown?: boolean;
}

/**
 * page component
 */
export interface PageBlok extends StoryblokBlok {
  component: 'page';
  body?: StoryblokBlok[];
}

/**
 * sub_nav_item component
 */
export interface SubNavItemBlok extends StoryblokBlok {
  component: 'sub_nav_item';
  label: string;
  link: StoryblokLink;
}

/**
 * teaser component
 */
export interface TeaserBlok extends StoryblokBlok {
  component: 'teaser';
  headline?: string;
}

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
  | ContentBlockBlok
  | CtaBlok
  | FeatureBlok
  | FooterBlok
  | GridBlok
  | HeaderBlok
  | HeroBlockBlok
  | NavItemBlok
  | PageBlok
  | SubNavItemBlok
  | TeaserBlok;

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

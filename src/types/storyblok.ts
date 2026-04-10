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
  is_external_url?: boolean;
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
 * card_item component
 */
export interface CardItemBlok extends StoryblokBlok {
  component: 'card_item';
  post_reference?: string;
}

/**
 * content_card_block component
 */
export interface ContentCardBlockBlok extends StoryblokBlok {
  component: 'content_card_block';
  variant?: 'primary' | 'secondary';
  title?: string;
  subtitle?: string;
  description?: string;
  cta_group?: (CtaBlok)[];
  images?: StoryblokAsset[];
  hide_image_mobile?: boolean;
}

/**
 * content_cards component
 */
export interface ContentCardsBlok extends StoryblokBlok {
  component: 'content_cards';
  blocks?: (ContentCardBlockBlok)[];
  layout?: '5/5' | '6/4' | '4/6';
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
  image_type?: 'auto' | 'full' | 'half';
  cta_group?: (CtaBlok)[];
  content_alignment?: 'left' | 'center' | 'right';
  position?: 'vertical' | 'vertical-reverse' | 'horizontal' | 'horizontal-reverse';
}

/**
 * markdown component
 */
export interface MarkdownBlok extends StoryblokBlok {
  component: 'markdown';
  content?: string;
}

/**
 * media component
 */
export interface MediaBlok extends StoryblokBlok {
  component: 'media';
  media_file: StoryblokAsset;
  poster_image?: StoryblokAsset;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  link?: StoryblokLink;
  aspect_ratio?: 'video' | 'square' | 'portrait' | 'wide' | 'auto';
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
  body?: (ContentCardsBlok | GridBlok | HeroBlockBlok | TabsBlok)[];
  og_title?: string;
  og_description?: string;
  og_image?: StoryblokAsset;
  SEO?: Record<string, unknown>;
}

/**
 * post component
 */
export interface PostBlok extends StoryblokBlok {
  component: 'post';
  title?: string;
  featured_image?: StoryblokAsset;
  excerpt?: string;
  body?: (RichtextBlok | MarkdownBlok | MediaBlok)[];
  SEO?: Record<string, unknown>;
  og_title?: string;
  og_description?: string;
  og_image?: StoryblokAsset;
}

/**
 * post_list component
 */
export interface PostListBlok extends StoryblokBlok {
  component: 'post_list';
  posts_per_page?: number;
}

/**
 * richtext component
 */
export interface RichtextBlok extends StoryblokBlok {
  component: 'richtext';
  content?: string;
}

/**
 * section_wrapper component
 */
export interface SectionWrapperBlok extends StoryblokBlok {
  component: 'section_wrapper';
  heading?: string;
  navigate_to?: (CtaBlok)[];
  childrens?: StoryblokBlok[];
  background_pattern?: StoryblokAsset;
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
 * tab_item component
 */
export interface TabItemBlok extends StoryblokBlok {
  component: 'tab_item';
  label?: string;
  content?: StoryblokBlok[];
}

/**
 * tabs component
 */
export interface TabsBlok extends StoryblokBlok {
  component: 'tabs';
  tabs?: (TabItemBlok)[];
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
  | CardItemBlok
  | ContentCardBlockBlok
  | ContentCardsBlok
  | CtaBlok
  | FeatureBlok
  | FooterBlok
  | GridBlok
  | HeaderBlok
  | HeroBlockBlok
  | MarkdownBlok
  | MediaBlok
  | NavItemBlok
  | PageBlok
  | PostBlok
  | PostListBlok
  | RichtextBlok
  | SectionWrapperBlok
  | SubNavItemBlok
  | TabItemBlok
  | TabsBlok
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
  published_at: string | null;
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

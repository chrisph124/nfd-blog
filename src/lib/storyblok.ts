import Page from "@/components/templates/Page";
import Post from "@/components/templates/Post";
import Feature from "@/components/molecules/Feature";
import Grid from "@/components/organisms/Grid";
import Teaser from "@/components/molecules/Teaser";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import NavItem from "@/components/molecules/NavItem";
import SubNavItem from "@/components/molecules/SubNavItem";
import Hero from "@/components/organisms/Hero";
import Tabs from "@/components/organisms/Tabs";
import SectionWrapper from "@/components/organisms/SectionWrapper";
import TabItem from "@/components/molecules/TabItem";
import Cta from "@/components/atoms/Cta";
import Richtext from "@/components/atoms/Richtext";
import Markdown from "@/components/atoms/Markdown";
import Media from "@/components/atoms/Media";
import CardItem from "@/components/molecules/CardItem";
import PostList from "@/components/organisms/PostList";
import ContentCards from "@/components/organisms/ContentCards";
import ContentCardBlock from "@/components/molecules/ContentCardBlock";

import { apiPlugin, storyblokInit } from '@storyblok/react/rsc';
import type { PostBlok, PageBlok, StoryblokStory } from '@/types/storyblok';
import { cache } from 'react';

// Use 'draft' in development for preview, 'published' in production
export const storyblokVersion: 'draft' | 'published' =
  process.env.NODE_ENV === 'development' ? 'draft' : 'published';

// Component mapping type
const components = {
  page: Page,
  post: Post,
  feature: Feature,
  grid: Grid,
  teaser: Teaser,
  header: Header,
  footer: Footer,
  nav_item: NavItem,
  sub_nav_item: SubNavItem,
  hero_block: Hero,
  tabs: Tabs,
  tab_item: TabItem,
  section_wrapper: SectionWrapper,
  cta: Cta,
  richtext: Richtext,
  markdown: Markdown,
  media: Media,
  card_item: CardItem,
  post_list: PostList,
  content_cards: ContentCards,
  content_card_block: ContentCardBlock,
} as const;

// Server-side initialization with access token
export const getStoryblokApi = storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN as string,
  use: [apiPlugin],
  components,
  apiOptions: {
    region: 'eu'
  },
});

// ============================================================================
// Site URL Helper
// ============================================================================

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    let url = process.env.NEXT_PUBLIC_SITE_URL;
    while (url.endsWith('/')) url = url.slice(0, -1);
    return url;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

// ============================================================================
// Shared Fetch Helpers
// ============================================================================

export const fetchHomeStory = cache(async () => {
  try {
    const storyblokApi = getStoryblokApi();
    const { data } = await storyblokApi.get('cdn/stories/home', { version: storyblokVersion });
    return data.story as StoryblokStory<PageBlok>;
  } catch (error) {
    console.error('Error fetching home story:', error);
    return null;
  }
});

export const fetchStoryBySlug = cache(async (slug: string) => {
  const storyblokApi = getStoryblokApi();

  // Try fetching as a post first (from posts/ folder)
  try {
    const { data } = await storyblokApi.get(`cdn/stories/posts/${slug}`, { version: storyblokVersion });
    return { story: data.story as StoryblokStory<PostBlok>, source: 'posts' as const };
  } catch {
    // If not found in posts/, try fetching as a regular page
  }

  try {
    const { data } = await storyblokApi.get(`cdn/stories/${slug}`, { version: storyblokVersion });
    return { story: data.story as StoryblokStory<PostBlok>, source: 'pages' as const };
  } catch {
    return null;
  }
});

export const fetchStory = cache(async (fullSlug: string) => {
  try {
    const storyblokApi = getStoryblokApi();
    const { data } = await storyblokApi.get(`cdn/stories/${fullSlug}`, { version: storyblokVersion });
    return data.story as StoryblokStory<PageBlok>;
  } catch (error) {
    console.error(`Error fetching story for slug: ${fullSlug}`, error);
    return null;
  }
});

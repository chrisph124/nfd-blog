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
import CodeTabs from "@/components/molecules/CodeTabs";
import Media from "@/components/atoms/Media";
import CardItem from "@/components/molecules/CardItem";
import PostList from "@/components/organisms/PostList";
import ContentCards from "@/components/organisms/ContentCards";
import ContentCardBlock from "@/components/molecules/ContentCardBlock";
import Alert from "@/components/molecules/Alert";
import Comparison from "@/components/molecules/Comparison";

import { apiPlugin, storyblokInit } from '@storyblok/react/rsc';
import type { PostBlok, PageBlok, StoryblokStory } from '@/types/storyblok';
import { cache } from 'react';
import { storyblokVersion } from './storyblok-version';

// Re-export so existing imports from '@/lib/storyblok' keep working.
export { storyblokVersion } from './storyblok-version';

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
  code_tabs: CodeTabs,
  media: Media,
  card_item: CardItem,
  post_list: PostList,
  content_cards: ContentCards,
  content_card_block: ContentCardBlock,
  alert: Alert,
  comparison: Comparison,
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
    url = url.replace(/^https:\/\/notesof\.dev(?=\/|$)/, 'https://www.notesof.dev');
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

  // Fetch both paths in parallel to avoid sequential waterfall
  const [postsResult, pagesResult] = await Promise.allSettled([
    storyblokApi.get(`cdn/stories/posts/${slug}`, { version: storyblokVersion }),
    storyblokApi.get(`cdn/stories/${slug}`, { version: storyblokVersion }),
  ]);

  // Prefer post match over page match
  if (postsResult.status === 'fulfilled') {
    return { story: postsResult.value.data.story as StoryblokStory<PostBlok>, source: 'posts' as const };
  }
  if (pagesResult.status === 'fulfilled') {
    return { story: pagesResult.value.data.story as StoryblokStory<PostBlok>, source: 'pages' as const };
  }
  return null;
});

/**
 * Fetch a story by slug forcing `version: 'published'`, regardless of the
 * env-derived `storyblokVersion`. Used by the machine-readable `.md` surface so
 * drafts never leak — even in dev/preview where the default version is 'draft'
 * (RT#1). Mirrors `fetchStoryBySlug`'s posts-before-pages resolution.
 */
export const fetchPublishedStoryBySlug = cache(async (slug: string) => {
  const storyblokApi = getStoryblokApi();

  const [postsResult, pagesResult] = await Promise.allSettled([
    storyblokApi.get(`cdn/stories/posts/${slug}`, { version: 'published' }),
    storyblokApi.get(`cdn/stories/${slug}`, { version: 'published' }),
  ]);

  if (postsResult.status === 'fulfilled') {
    return { story: postsResult.value.data.story as StoryblokStory<PostBlok>, source: 'posts' as const };
  }
  if (pagesResult.status === 'fulfilled') {
    return { story: pagesResult.value.data.story as StoryblokStory<PostBlok>, source: 'pages' as const };
  }
  return null;
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

export const fetchAllPosts = cache(async (): Promise<StoryblokStory<PostBlok>[]> => {
  try {
    const storyblokApi = getStoryblokApi();
    const perPage = 100;
    const allStories: StoryblokStory<PostBlok>[] = [];
    let page = 1;

    while (true) {
      const response = (await storyblokApi.get('cdn/stories', {
        version: storyblokVersion,
        content_type: 'post',
        sort_by: 'first_published_at:desc',
        per_page: perPage,
        page,
      })) as { data: { stories: StoryblokStory<PostBlok>[] }; headers: { total?: string } };

      const stories = response.data.stories ?? [];
      allStories.push(...stories);

      const total = Number.parseInt(response.headers.total || '0', 10);
      if (allStories.length >= total || stories.length < perPage) break;
      page += 1;
      if (page > 50) {
        console.warn(`fetchAllPosts: hit pagination cap at page 50 (${allStories.length}/${total} stories); results may be undercounted.`);
        break;
      }
    }

    return allStories;
  } catch (error) {
    console.error('Error fetching all posts:', error);
    return [];
  }
});
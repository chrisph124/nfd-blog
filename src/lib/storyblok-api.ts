import { apiPlugin, storyblokInit } from '@storyblok/react/rsc';
import type { PostBlok, PageBlok, StoryblokStory } from '@/types/storyblok';

// Lightweight API-only init — no component imports.
// Use this in API routes (e.g., OG image) to avoid bundling all React components.
const getApi = storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN as string,
  use: [apiPlugin],
  apiOptions: { region: 'eu' },
});

export async function fetchStoryApi(fullSlug: string) {
  try {
    const api = getApi();
    const { data } = await api.get(`cdn/stories/${fullSlug}`, { version: 'draft' });
    return data.story as StoryblokStory<PageBlok>;
  } catch {
    return null;
  }
}

export async function fetchStoryBySlugApi(slug: string) {
  const api = getApi();

  try {
    const { data } = await api.get(`cdn/stories/posts/${slug}`, { version: 'draft' });
    return data.story as StoryblokStory<PostBlok>;
  } catch {
    // Not a post — try as page
  }

  try {
    const { data } = await api.get(`cdn/stories/${slug}`, { version: 'draft' });
    return data.story as StoryblokStory<PageBlok>;
  } catch {
    return null;
  }
}

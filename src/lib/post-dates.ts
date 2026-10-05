import type { PostBlok, StoryblokStory } from '@/types/storyblok';

// `published_at` moves on every republish (a retag or an SEO edit), so it never
// counts as a content change. A real revision is recorded in `updated_on`.

const STORYBLOK_DATETIME = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/;
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/;

function toIsoUtc(value: string): string | undefined {
  const storyblokMatch = STORYBLOK_DATETIME.exec(value);
  if (storyblokMatch) return `${storyblokMatch[1]}T${storyblokMatch[2]}:00.000Z`;
  if (!ISO_WITH_ZONE.test(value)) return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

export function getPublishedDate(story: StoryblokStory<PostBlok>): string {
  return story.first_published_at || story.created_at;
}

export function getUpdatedDate(story: StoryblokStory<PostBlok>): string | undefined {
  const raw = story.content.updated_on?.trim();
  if (!raw) return undefined;
  const updated = toIsoUtc(raw);
  if (!updated) return undefined;
  return Date.parse(updated) > Date.parse(getPublishedDate(story)) ? updated : undefined;
}

export function getModifiedDate(story: StoryblokStory<PostBlok>): string {
  return getUpdatedDate(story) ?? getPublishedDate(story);
}

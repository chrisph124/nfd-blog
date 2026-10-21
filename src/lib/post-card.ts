import type { PostBlok, StoryblokStory } from '@/types/storyblok';
import { getPublishedDate } from '@/lib/post-dates';
import { getStoryReadingTime } from '@/lib/utils';

export interface PostCardData {
  uuid: string;
  href: string;
  title: string;
  excerpt?: string;
  image?: { src: string; alt: string };
  date: string;
  readingTime: string;
}

// Listings serialize this record instead of the story, so post bodies never
// reach the client payload.
export function toPostCard(story: StoryblokStory<PostBlok>): PostCardData {
  const { excerpt, featured_image, body } = story.content;
  const title = story.content.title?.trim() || story.name;

  return {
    uuid: story.uuid,
    href: `/${story.full_slug.replace(/^posts\//, '')}`,
    title,
    ...(excerpt && { excerpt }),
    ...(featured_image?.filename && {
      image: { src: featured_image.filename, alt: featured_image.alt || title },
    }),
    date: getPublishedDate(story),
    readingTime: getStoryReadingTime(body),
  };
}

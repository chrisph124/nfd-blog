import { makeStoryblokEditable } from '@/lib/storyblok-utils';
import { getStoryblokApi, storyblokVersion } from '@/lib/storyblok';
import type { CardItemBlok, StoryblokStory, PostBlok } from '@/types/storyblok';
import Card from './Card';
import { toPostCard } from '@/lib/post-card';

interface CardItemProps {
  blok: CardItemBlok;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A server component: the referenced post is fetched while rendering, so the card ships in the
// HTML and the browser never downloads the Storyblok client or its component registry.
export default async function CardItem({ blok }: Readonly<CardItemProps>) {
  const { post_reference } = blok;
  if (!post_reference) return null;

  const params: Record<string, string> = { version: storyblokVersion };
  if (UUID_PATTERN.test(post_reference)) params.find_by = 'uuid';

  let story: StoryblokStory<PostBlok>;
  try {
    const response = await getStoryblokApi().get(`cdn/stories/${post_reference}` as const, params);
    story = (response.data as { story: StoryblokStory<PostBlok> }).story;
  } catch (err) {
    console.error(`CardItem: Failed to fetch post ${post_reference}:`, err);
    if (process.env.NODE_ENV !== 'development') return null;
    return (
      <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50">
        <p className="text-red-700 font-semibold">CardItem Error</p>
        <p className="text-sm text-red-600">
          Failed to fetch post: <code className="bg-red-100 px-1">{String(post_reference)}</code>
        </p>
        <p className="text-xs text-red-500 mt-1">
          Post not found in Storyblok. Check that it exists and is saved.
        </p>
      </div>
    );
  }

  return (
    <div {...makeStoryblokEditable(blok)}>
      <Card post={toPostCard(story)} />
    </div>
  );
}

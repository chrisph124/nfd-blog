import Card from '@/components/molecules/Card';
import type { PostBlok, StoryblokStory } from '@/types/storyblok';

interface PostGridProps {
  posts: StoryblokStory<PostBlok>[];
}

/**
 * Server-safe post card grid. Mirrors the live homepage grid
 * (`PostListClient.tsx` — `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3
 * gap-6`) without its `'use client'` pagination, so static server surfaces (the
 * tag archives) reuse the same look. First card is `priority` for LCP.
 */
export default function PostGrid({ posts }: Readonly<PostGridProps>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {posts.map((story, index) => (
        <Card key={story.uuid} story={story} priority={index === 0} />
      ))}
    </div>
  );
}

import Card from '@/components/molecules/Card';
import type { PostBlok, StoryblokStory } from '@/types/storyblok';
import { toPostCard } from '@/lib/post-card';

interface PostGridProps {
  posts: StoryblokStory<PostBlok>[];
}

/** Server-rendered, unpaginated twin of the PostListClient grid; keep the grid classes in sync. */
export default function PostGrid({ posts }: Readonly<PostGridProps>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {posts.map((story, index) => (
        <Card
          key={story.uuid}
          post={toPostCard(story)}
          priority={index === 0}
          // First card is the LCP element: transform-only reveal, no opacity gate.
          className={index === 0 ? 'post-card-reveal-lcp' : 'post-card-reveal'}
          style={{ '--reveal-i': index } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

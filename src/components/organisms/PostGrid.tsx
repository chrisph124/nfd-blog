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
 *
 * Cards also carry the homepage `post-card-reveal` fade-up. It is CSS-only and
 * `prefers-reduced-motion`-guarded (globals.css), so it runs on these
 * server-rendered cards without a client boundary. The archive is unpaginated,
 * so `--reveal-i` is a continuous `index` (no per-page reset like the homepage).
 * The first (priority/LCP) card uses the `post-card-reveal-lcp` variant instead:
 * a transform-only reveal with no `opacity: 0` start, so it stays an eligible
 * LCP candidate and paints on first render.
 */
export default function PostGrid({ posts }: Readonly<PostGridProps>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {posts.map((story, index) => (
        <Card
          key={story.uuid}
          story={story}
          priority={index === 0}
          // First card is the LCP element: transform-only reveal, no opacity gate.
          className={index === 0 ? 'post-card-reveal-lcp' : 'post-card-reveal'}
          style={{ '--reveal-i': index } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

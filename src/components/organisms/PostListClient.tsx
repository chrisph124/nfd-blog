'use client';

import type { StoryblokStory, PostBlok } from '@/types/storyblok';

interface PostListClientProps {
  initialPosts: StoryblokStory<PostBlok>[];
  perPage: number;
  hasMore: boolean;
}

export default function PostListClient({
  initialPosts,
  perPage,
  hasMore,
}: Readonly<PostListClientProps>) {
  // TODO: Implement full client component in Phase 3
  return (
    <div className="text-center py-12">
      <p>PostListClient - Phase 3 implementation pending</p>
      <p>Posts: {initialPosts.length}, Per Page: {perPage}, Has More: {hasMore.toString()}</p>
    </div>
  );
}

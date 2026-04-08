'use client';

import { useState } from 'react';
import Card from '@/components/molecules/Card';
import FadeIn from '@/components/atoms/FadeIn';
import type { StoryblokStory, PostBlok } from '@/types/storyblok';

interface PostListClientProps {
  initialPosts: StoryblokStory<PostBlok>[];
  perPage: number;
  hasMore: boolean;
}

interface ApiResponse {
  stories: StoryblokStory<PostBlok>[];
  total: number;
}

export default function PostListClient({
  initialPosts,
  perPage,
  hasMore: initialHasMore,
}: Readonly<PostListClientProps>) {
  const [posts, setPosts] = useState<StoryblokStory<PostBlok>[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load more button classes (98 chars)
  const LOAD_MORE_BUTTON_CLASSES = "px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  const loadMore = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts?page=${page + 1}&per_page=${perPage}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();

      setPosts((prev) => {
        const newPosts = [...prev, ...data.stories];
        setHasMore(newPosts.length < data.total);
        return newPosts;
      });
      setPage((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more posts';
      setError(errorMessage);
      console.error('Load more error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1280px] px-4 md:px-8 lg:px-12 xl:px-5 mx-auto">
      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {posts.map((story, index) => (
          <FadeIn key={story.uuid} delay={(index % perPage) * 0.08}>
            <Card story={story} priority={index === 0} />
          </FadeIn>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex flex-col items-center gap-4">
          {error && (
            <p className="text-red-600 text-sm" role="alert">
              {error}
            </p>
          )}

          <button
            onClick={loadMore}
            disabled={loading}
            className={LOAD_MORE_BUTTON_CLASSES}
            aria-label="Load more posts"
          >
            {loading ? 'Loading...' : 'Load More Posts'}
          </button>
        </div>
      )}
    </div>
  );
}

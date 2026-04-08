'use client';

import { useState, useEffect } from 'react';
import { makeStoryblokEditable } from '@/lib/storyblok-utils';
import { getStoryblokApi } from '@/lib/storyblok';
import type { CardItemBlok, StoryblokStory, PostBlok } from '@/types/storyblok';
import Card from './Card';
import { CardSkeleton } from '@/components/atoms/Skeleton';

interface CardItemProps {
  blok: CardItemBlok;
}

export default function CardItem({ blok }: Readonly<CardItemProps>) {
  const { post_reference } = blok;
  const [story, setStory] = useState<StoryblokStory<PostBlok> | null>(null);
  const [loading, setLoading] = useState(!!post_reference);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!post_reference) return;

    let cancelled = false;

    const fetchPost = async () => {
      try {
        const storyblokApi = getStoryblokApi();

        // Determine the correct identifier and API parameters
        let storyIdentifier: string;
        const apiParams: Record<string, string> = { version: 'draft' };

        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(post_reference)) {
          storyIdentifier = post_reference;
          apiParams.find_by = 'uuid';
        } else {
          storyIdentifier = post_reference;
        }

        const response = await storyblokApi.get(`cdn/stories/${storyIdentifier}` as const, apiParams);
        const fetchedStory = (response.data as { story: StoryblokStory<PostBlok> }).story;

        if (!cancelled) {
          setStory(fetchedStory);
          setLoading(false);
        }
      } catch (err) {
        console.error(`CardItem: Failed to fetch post ${post_reference}:`, err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchPost();
    return () => { cancelled = true; };
  }, [post_reference]);

  if (!post_reference) {
    return null;
  }

  if (loading) {
    return <CardSkeleton />;
  }

  if (error || !story) {
    if (process.env.NODE_ENV === 'development') {
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
    return null;
  }

  return (
    <div {...makeStoryblokEditable(blok)}>
      <Card story={story} />
    </div>
  );
}

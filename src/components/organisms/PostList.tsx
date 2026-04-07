import { getStoryblokApi } from '@/lib/storyblok';
import PostListClient from './PostListClient';
import type { PostListBlok, StoryblokStory, PostBlok } from '@/types/storyblok';

interface PostListProps {
  blok: PostListBlok;
}

interface StoriesResponse {
  data: {
    stories: StoryblokStory<PostBlok>[];
  };
  headers: {
    total?: string;
  };
}

async function fetchPosts(perPage: number) {
  try {
    const storyblokApi = getStoryblokApi();
    const response = await storyblokApi.get('cdn/stories', {
      version: 'draft',
      content_type: 'post',
      sort_by: 'first_published_at:desc',
      per_page: perPage,
      page: 1,
    }) as StoriesResponse;

    const { data, headers } = response;
    const total = parseInt(headers.total || '0');
    const hasMore = data.stories.length < total;

    return { stories: data.stories, hasMore };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return null;
  }
}

export default async function PostList({ blok }: Readonly<PostListProps>) {
  const perPage = blok.posts_per_page || 12;
  const result = await fetchPosts(perPage);

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load posts. Please try again later.</p>
      </div>
    );
  }

  return (
    <PostListClient
      initialPosts={result.stories}
      perPage={perPage}
      hasMore={result.hasMore}
    />
  );
}

import { getStoryblokApi } from '@/lib/storyblok';
import type { StoryblokStory, PostBlok } from '@/types/storyblok';
import Card from '@/components/molecules/Card';

interface CardListProps {
  filterByTag?: string;
  startsWithPath?: string;
}

interface StoriesResponse {
  data: {
    stories: StoryblokStory<PostBlok>[];
  };
}

export default async function CardList({
  filterByTag,
  startsWithPath = 'posts/'
}: CardListProps) {
  const storyblokApi = getStoryblokApi();

  const params: Record<string, string> = {
    starts_with: startsWithPath,
    version: 'draft',
    content_type: 'post',
  };

  if (filterByTag) {
    params.with_tag = filterByTag;
  }

  const { data } = await storyblokApi.get('cdn/stories', params) as StoriesResponse;

  if (!data.stories || data.stories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No posts found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {data.stories.map((story) => (
        <Card key={story.uuid} story={story} />
      ))}
    </div>
  );
}

import { getStoryblokApi } from '@/lib/storyblok';
import CardList from '@/components/organisms/CardList';
import type { StoryblokStory, PostBlok } from '@/types/storyblok';

interface TagPageProps {
  params: Promise<{
    tag: string;
  }>;
}

interface StoriesResponse {
  data: {
    stories: StoryblokStory<PostBlok>[];
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;

  // Convert URL slug to readable title (e.g., "ai" -> "AI", "afk-life" -> "AFK Life")
  const formatTitle = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.toUpperCase())
      .join(' ');
  };

  const categoryTitle = formatTitle(tag);

  return (
    <div className="max-w-[1240px] px-6 md:px-10 lg:px-15 2xl:px-20 mx-auto my-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{categoryTitle}</h1>
      </div>

      <CardList filterByTag={tag} startsWithPath="posts/" />
    </div>
  );
}

// Generate static params for all tags used in posts
export async function generateStaticParams() {
  const storyblokApi = getStoryblokApi();

  try {
    const { data } = await storyblokApi.get('cdn/stories', {
      version: 'draft',
      content_type: 'post',
    }) as StoriesResponse;

    // Collect all unique tags from all posts
    const tagSet = new Set<string>();

    data.stories?.forEach((story) => {
      story.tag_list?.forEach((tag) => {
        tagSet.add(tag);
      });
    });

    // Return array of tag params for static generation
    return Array.from(tagSet).map((tag) => ({
      tag: tag,
    }));
  } catch (error) {
    console.error('Error generating tag params:', error);
    return [];
  }
}

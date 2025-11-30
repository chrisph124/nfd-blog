import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { notFound } from 'next/navigation';
import type { StoryblokLinksResponse, StoryblokStoryLink } from '@/types/storyblok';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const storyblokApi = getStoryblokApi();

    // Try fetching as a post first (from posts/ folder)
    try {
      const { data } = await storyblokApi.get(`cdn/stories/posts/${slug}`, {
        version: 'draft',
      });

      return (
        <div className="page">
          <StoryblokStory story={data.story} />
        </div>
      );
    } catch {
      // If not found in posts/, try fetching as a regular page
      const { data } = await storyblokApi.get(`cdn/stories/${slug}`, {
        version: 'draft',
      });

      return (
        <div className="page">
          <StoryblokStory story={data.story} />
        </div>
      );
    }
  } catch (error) {
    console.error(`Error fetching story for slug: ${slug}`, error);
    notFound();
  }
}

// Generate static params for known pages (optional, for static generation)
export async function generateStaticParams() {
  const storyblokApi = getStoryblokApi();

  try {
    const { data } = await storyblokApi.get('cdn/links', {
      version: 'draft',
    }) as { data: StoryblokLinksResponse };

    const links = Object.values(data.links) as StoryblokStoryLink[];

    const paths = links
      .filter((link) => !link.is_folder && link.slug !== 'home' && !link.slug.startsWith('global/'))
      .map((link) => {
        // Strip "posts/" prefix for root-level URLs
        const slug = link.slug.replace(/^posts\//, '');
        return { slug };
      });

    return paths;
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

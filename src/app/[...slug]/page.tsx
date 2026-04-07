import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { notFound } from 'next/navigation';
import type { StoryblokLinksResponse, StoryblokStoryLink } from '@/types/storyblok';

export const revalidate = 3600; // Revalidate every 1 hour

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

async function fetchStory(fullSlug: string) {
  try {
    const storyblokApi = getStoryblokApi();
    const { data } = await storyblokApi.get(`cdn/stories/${fullSlug}`, {
      version: 'draft',
    });
    return data.story;
  } catch (error) {
    console.error(`Error fetching story for slug: ${fullSlug}`, error);
    return null;
  }
}

export default async function CatchAllPage({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = slug.join('/');

  const story = await fetchStory(fullSlug);
  if (!story) notFound();

  return (
    <div className="page">
      <StoryblokStory story={story} />
    </div>
  );
}

// Generate static params for nested pages
export async function generateStaticParams() {
  const storyblokApi = getStoryblokApi();

  try {
    const { data } = await storyblokApi.get('cdn/links', {
      version: 'draft',
    }) as { data: StoryblokLinksResponse };

    const links = Object.values(data.links) as StoryblokStoryLink[];

    const paths = links
      .filter((link) => !link.is_folder && link.slug !== 'home' && !link.slug.startsWith('global/'))
      .map((link) => ({
        slug: link.slug.split('/'),
      }));

    return paths;
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { notFound } from 'next/navigation';
import type { StoryblokLinksResponse, StoryblokStoryLink } from '@/types/storyblok';

interface PageProps {
  params: {
    slug: string[];
  };
}

export default async function CatchAllPage({ params }: PageProps) {
  const { slug } = params;
  const fullSlug = slug.join('/');

  try {
    const storyblokApi = getStoryblokApi();
    const { data } = await storyblokApi.get(`cdn/stories/${fullSlug}`, {
      version: 'draft',
    });

    return (
      <div className="page">
        <StoryblokStory story={data.story} />
      </div>
    );
  } catch (error) {
    console.error(`Error fetching story for slug: ${fullSlug}`, error);
    notFound();
  }
}

// Generate static params for nested pages
export async function generateStaticParams() {
  const storyblokApi = getStoryblokApi();

  try {
    const { data } = await storyblokApi.get<StoryblokLinksResponse>('cdn/links', {
      version: 'draft',
    });

    const links = Object.values(data.links) as StoryblokStoryLink[];

    const paths = links
      .filter((link) => !link.is_folder && link.slug !== 'home')
      .map((link) => ({
        slug: link.slug.split('/'),
      }));

    return paths;
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

import { getStoryblokApi, fetchStory, getSiteUrl } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { StoryblokLinksResponse, StoryblokStoryLink } from '@/types/storyblok';

export const revalidate = 3600; // Revalidate every 1 hour

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const fullSlug = slug.join('/');
  const story = await fetchStory(fullSlug);
  if (!story) return {};

  const content = story.content;
  const siteUrl = getSiteUrl();

  const title = content.og_title || story.name;
  const description = content.og_description || '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `${siteUrl}/api/og?slug=${encodeURIComponent(fullSlug)}`, width: 1200, height: 630 }],
    },
  };
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

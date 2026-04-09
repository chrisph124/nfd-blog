import { fetchHomeStory, getSiteUrl } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 3600; // Revalidate every 1 hour

export async function generateMetadata(): Promise<Metadata> {
  const story = await fetchHomeStory();
  const siteUrl = getSiteUrl();
  const content = story?.content;

  return {
    title: content?.og_title || 'Notes of Dev',
    description: content?.og_description || 'Blog of a developer',
    openGraph: {
      title: content?.og_title || 'Notes of Dev',
      description: content?.og_description || 'Blog of a developer',
      images: [{ url: `${siteUrl}/api/og?slug=home`, width: 1200, height: 630 }],
    },
  };
}

export default async function Home() {
  const story = await fetchHomeStory();
  if (!story) notFound();

  return (
    <div className="page">
      <StoryblokStory story={story} />
    </div>
  );
}
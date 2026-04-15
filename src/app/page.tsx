import { fetchHomeStory, getSiteUrl } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildWebSiteJsonLd } from '@/lib/seo-structured-data';

export const revalidate = 86400; // Revalidate every 24 hours (webhook handles real-time updates)

export async function generateMetadata(): Promise<Metadata> {
  const story = await fetchHomeStory();
  const siteUrl = getSiteUrl();
  const content = story?.content;

  const title = content?.og_title?.trim() || 'Notes of Dev';
  const description = content?.og_description?.trim()
    || 'Thoughts on frontend engineering, AI, and building interfaces — by Hieu (Chris) Pham.';

  return {
    title,
    description,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title,
      description,
      images: [{ url: `${siteUrl}/api/og?slug=home`, width: 1200, height: 630 }],
    },
  };
}

export default async function Home() {
  const story = await fetchHomeStory();
  if (!story) notFound();

  const siteUrl = getSiteUrl();
  const jsonLd = buildWebSiteJsonLd({ siteUrl, siteName: 'Notes of Dev' });

  return (
    <div className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StoryblokStory story={story} />
    </div>
  );
}
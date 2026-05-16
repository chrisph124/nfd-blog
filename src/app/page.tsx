import { fetchHomeStory, getSiteUrl } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildWebSiteJsonLd, buildOrganizationJsonLd } from '@/lib/seo-structured-data';
import { stripEntities } from '@/lib/seo/strip-entities';

export const revalidate = 86400; // Revalidate every 24 hours (webhook handles real-time updates)

export async function generateMetadata(): Promise<Metadata> {
  const story = await fetchHomeStory();
  const siteUrl = getSiteUrl();
  const content = story?.content;

  const title = stripEntities(content?.og_title?.trim()) || 'Notes of Dev';
  const description =
    stripEntities(content?.og_description?.trim()) ||
    'Thoughts on frontend engineering, AI, and building interfaces — by Hieu (Chris) Pham.';

  return {
    title,
    description,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      url: siteUrl,
      title,
      description,
      images: [
        {
          url: `${siteUrl}/api/og?slug=home`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      title,
      description,
      images: [`${siteUrl}/api/og?slug=home`],
    },
  };
}

export default async function Home() {
  const story = await fetchHomeStory();
  if (!story) notFound();

  const siteUrl = getSiteUrl();
  const description =
    stripEntities(story.content?.og_description?.trim()) ||
    'Thoughts on frontend engineering, AI, and building interfaces — by Hieu (Chris) Pham.';

  const websiteJsonLd = buildWebSiteJsonLd({
    siteUrl,
    siteName: 'Notes of Dev',
    description,
  });
  const orgJsonLd = buildOrganizationJsonLd({ siteUrl });

  const escape = (json: object) => JSON.stringify(json).replace(/</g, '\\u003c');

  return (
    <div className="page">
      <h1 className="sr-only">Notes of Dev — frontend engineering, AI, and building interfaces</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escape(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escape(orgJsonLd) }}
      />
      <StoryblokStory story={story} />
    </div>
  );
}

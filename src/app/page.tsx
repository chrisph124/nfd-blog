import { fetchHomeStory, getSiteUrl } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildHomeJsonLdGraph } from '@/lib/seo-structured-data';
import { escapeJsonLd } from '@/lib/seo/json-ld-escape';
import { AUTHOR_SAME_AS } from '@/lib/seo/author';
import { stripEntities } from '@/lib/seo/strip-entities';

export const revalidate = 86400; // Revalidate every 24 hours as fallback; webhook (/api/revalidate) handles real-time updates on publish

export async function generateMetadata(): Promise<Metadata> {
  const story = await fetchHomeStory();
  const siteUrl = getSiteUrl();
  const content = story?.content;

  const title = stripEntities(content?.og_title?.trim()) || 'Notes of Dev — Frontend Engineering, AI & CMS Notes';
  const description =
    stripEntities(content?.og_description?.trim()) ||
    'A working notebook on frontend engineering, AI workflows, and headless CMS architecture — research, experiments, and patterns from building real interfaces.';

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
    'A working notebook on frontend engineering, AI workflows, and headless CMS architecture — research, experiments, and patterns from building real interfaces.';

  const homeJsonLd = buildHomeJsonLdGraph({
    siteUrl,
    siteName: 'Notes of Dev',
    description,
    sameAs: AUTHOR_SAME_AS,
  });

  return (
    <div className="page">
      <h1 className="sr-only">Notes of Dev — frontend engineering, AI, and building interfaces</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(homeJsonLd) }}
      />
      <StoryblokStory story={story} />
    </div>
  );
}

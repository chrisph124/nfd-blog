import { fetchHomeStory, getSiteUrl } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildHomeJsonLdGraph } from '@/lib/seo-structured-data';
import { escapeJsonLd } from '@/lib/seo/json-ld-escape';
import { AUTHOR_SAME_AS } from '@/lib/seo/author';
import { stripEntities } from '@/lib/seo/strip-entities';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/seo/site';

export const revalidate = 86400; // Revalidate every 24 hours as fallback; webhook (/api/revalidate) handles real-time updates on publish

export async function generateMetadata(): Promise<Metadata> {
  const story = await fetchHomeStory();
  const siteUrl = getSiteUrl();
  const content = story?.content;

  const title = stripEntities(content?.og_title?.trim()) || SITE_TITLE;
  const description =
    stripEntities(content?.og_description?.trim()) ||
    SITE_DESCRIPTION;

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
    SITE_DESCRIPTION;

  const homeJsonLd = buildHomeJsonLdGraph({
    siteUrl,
    siteName: 'Notes of Dev',
    description,
    sameAs: AUTHOR_SAME_AS,
  });

  return (
    <div className="page">
      <section
        aria-labelledby="home-masthead-title"
        className="max-w-7xl px-4 md:px-8 lg:px-12 xl:px-5 mx-auto mb-8 md:mb-10 flex flex-col gap-3"
      >
        <h1 id="home-masthead-title" className="display-1 font-bold text-foreground text-balance">
          Developer notes on AI, software and the tools we build with
        </h1>
        <p className="max-w-3xl text-gray-600">
          Research, experiments and working patterns by Hieu (Chris) Pham.
        </p>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(homeJsonLd) }}
      />
      <StoryblokStory story={story} />
    </div>
  );
}

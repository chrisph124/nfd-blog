import { getStoryblokApi, fetchStory, getSiteUrl, storyblokVersion } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { StoryblokLinksResponse, StoryblokStoryLink } from '@/types/storyblok';
import { stripEntities } from '@/lib/seo/strip-entities';

export const revalidate = 86400; // Revalidate every 24 hours as fallback; webhook (/api/revalidate) handles real-time updates on publish

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
  // Posts live under the internal `posts/` folder but publish at the site root;
  // `proxy.ts` 308-redirects `/posts/{slug}` -> `/{slug}`. If this catch-all
  // still renders a `posts/*` path (Storyblok editor preview or the proxy's
  // fail-open branch), point the canonical + og:url at the clean root so a
  // crawler never sees a self-referencing duplicate canonical (defense-in-depth
  // behind the redirect). No-op for non-post slugs.
  const canonicalPath = fullSlug.replace(/^posts\//, '');
  const canonicalUrl = `${siteUrl}/${canonicalPath}`;

  const title = stripEntities(content.og_title?.trim() || story.name);
  const description = stripEntities(content.og_description?.trim() || '');

  return {
    title,
    description,
    alternates: {
      canonical: `/${canonicalPath}`,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title,
      description,
      images: [
        {
          url: `${siteUrl}/api/og?slug=${encodeURIComponent(fullSlug)}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      title,
      description,
      images: [`${siteUrl}/api/og?slug=${encodeURIComponent(fullSlug)}`],
    },
  };
}

export default async function CatchAllPage({ params }: Readonly<PageProps>) {
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
      version: storyblokVersion,
    }) as { data: StoryblokLinksResponse };

    const links = Object.values(data.links) as StoryblokStoryLink[];

    const paths = links
      // Exclude posts: they render at the site root via `[slug]` (their
      // `posts/` prefix stripped), and `proxy.ts` 308-redirects `/posts/*` to
      // that root URL. Generating `/posts/*` here would only rebuild the dead
      // duplicate pages the redirect exists to retire.
      .filter(
        (link) =>
          !link.is_folder &&
          link.slug !== 'home' &&
          !link.slug.startsWith('global/') &&
          !link.slug.startsWith('posts/')
      )
      .map((link) => ({
        slug: link.slug.split('/'),
      }));

    return paths;
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

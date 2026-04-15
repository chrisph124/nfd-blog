import { getStoryblokApi, fetchStoryBySlug, getSiteUrl, storyblokVersion } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { StoryblokLinksResponse, StoryblokStoryLink } from '@/types/storyblok';
import Post from '@/components/templates/Post';
import { buildBlogPostingJsonLd } from '@/lib/seo-structured-data';

export const revalidate = 86400; // Revalidate every 24 hours (webhook handles real-time updates)

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchStoryBySlug(slug);
  if (!result) return {};

  const { story } = result;
  const content = story.content;
  const siteUrl = getSiteUrl();

  const title = content.og_title?.trim() || content.title?.trim() || story.name;
  const description = content.og_description?.trim() || content.excerpt?.trim() || '';

  return {
    title,
    description,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title,
      description,
      images: [{ url: `${siteUrl}/api/og?slug=${encodeURIComponent(slug)}`, width: 1200, height: 630 }],
    },
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;

  const result = await fetchStoryBySlug(slug);
  if (!result) {
    console.error(`Error fetching story for slug: ${slug}`);
    notFound();
  }

  const { story, source } = result;

  if (source === 'posts' && story.content.component === 'post') {
    const siteUrl = getSiteUrl();
    const jsonLd = buildBlogPostingJsonLd({
      siteUrl,
      slug,
      title: story.content.title?.trim() || story.name,
      description: story.content.excerpt?.trim() || '',
      datePublished: story.first_published_at || story.created_at,
      imageUrl: story.content.featured_image?.filename,
      authorName: 'Hieu (Chris) Pham',
    });

    return (
      <div className="page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Post
          blok={story.content}
          tags={story.tag_list}
          createdAt={story.first_published_at || story.created_at}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <StoryblokStory story={story} />
    </div>
  );
}

// Generate static params for known pages (optional, for static generation)
export async function generateStaticParams() {
  const storyblokApi = getStoryblokApi();

  try {
    const { data } = await storyblokApi.get('cdn/links', {
      version: storyblokVersion,
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

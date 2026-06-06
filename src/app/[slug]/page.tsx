import { getStoryblokApi, fetchStoryBySlug, getSiteUrl, storyblokVersion } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { StoryblokLinksResponse, StoryblokStoryLink } from '@/types/storyblok';
import Post from '@/components/templates/Post';
import {
  buildBlogPostingJsonLd,
  buildPersonJsonLd,
  estimateWordCount,
} from '@/lib/seo-structured-data';
import { escapeJsonLd } from '@/lib/seo/json-ld-escape';
import { AUTHOR_NAME, AUTHOR_SAME_AS } from '@/lib/seo/author';
import { stripEntities } from '@/lib/seo/strip-entities';

export const revalidate = 86400; // Revalidate every 24 hours as fallback; webhook (/api/revalidate) handles real-time updates on publish

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchStoryBySlug(slug);
  if (!result) return {};

  const { story, source } = result;
  const content = story.content;
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/${slug}`;

  const title = stripEntities(content.og_title?.trim() || content.title?.trim() || story.name);
  const description = stripEntities(
    content.og_description?.trim() || content.excerpt?.trim() || ''
  );

  const isPost = source === 'posts' && content.component === 'post';
  const ogType: 'article' | 'profile' | 'website' = isPost
    ? 'article'
    : slug === 'about'
      ? 'profile'
      : 'website';

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      type: ogType,
      url: canonicalUrl,
      title,
      description,
      images: [
        {
          url: `${siteUrl}/api/og?slug=${encodeURIComponent(slug)}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      title,
      description,
      images: [`${siteUrl}/api/og?slug=${encodeURIComponent(slug)}`],
    },
  };

  if (isPost) {
    const datePublished = story.first_published_at || story.created_at;
    const dateModified = story.published_at || datePublished;
    const articleOther: Record<string, string | string[]> = {
      'article:published_time': datePublished,
      'article:modified_time': dateModified,
      'article:author': AUTHOR_NAME,
    };
    if (story.tag_list && story.tag_list.length > 0) {
      articleOther['article:tag'] = story.tag_list;
    }
    metadata.other = articleOther;
  }

  return metadata;
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;

  const result = await fetchStoryBySlug(slug);
  if (!result) {
    console.error(`Error fetching story for slug: ${slug}`);
    notFound();
  }

  const { story, source } = result;
  const siteUrl = getSiteUrl();

  if (source === 'posts' && story.content.component === 'post') {
    const datePublished = story.first_published_at || story.created_at;
    const dateModified = story.published_at || datePublished;
    const title = stripEntities(story.content.title?.trim() || story.name);
    const description = stripEntities(story.content.excerpt?.trim() || '');

    const bodyText = JSON.stringify(story.content.body ?? '');
    const wordCount = estimateWordCount(bodyText);

    const jsonLd = buildBlogPostingJsonLd({
      siteUrl,
      slug,
      title,
      description,
      datePublished,
      dateModified,
      imageUrl: story.content.featured_image?.filename,
      authorName: AUTHOR_NAME,
      authorUrl: `${siteUrl}/about`,
      wordCount: wordCount > 0 ? wordCount : undefined,
    });

    return (
      <div className="page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }}
        />
        <Post
          blok={story.content}
          tags={story.tag_list}
          createdAt={datePublished}
        />
      </div>
    );
  }

  if (slug === 'about') {
    const personJsonLd = buildPersonJsonLd({
      siteUrl,
      name: AUTHOR_NAME,
      description: 'Frontend engineer writing about software, AI, and building interfaces.',
      sameAs: AUTHOR_SAME_AS,
    });

    return (
      <div className="page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(personJsonLd) }}
        />
        <StoryblokStory story={story} />
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

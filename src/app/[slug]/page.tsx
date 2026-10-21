import { getStoryblokApi, fetchStoryBySlug, getSiteUrl, storyblokVersion } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { metadata as notFoundMetadata } from '@/app/not-found';
import type { HeroBlockBlok, StoryblokBlok, StoryblokLinksResponse, StoryblokStoryLink } from '@/types/storyblok';
import Post from '@/components/templates/Post';
import AuthorProfile from '@/components/organisms/AuthorProfile';
import {
  buildBlogPostingJsonLd,
  buildPersonJsonLd,
  estimateWordCount,
} from '@/lib/seo-structured-data';
import { extractPostContent } from '@/lib/llms/post-to-markdown';
import { getTagCensus, buildTagLinks, selectRelatedPosts } from '@/lib/tags';
import { escapeJsonLd } from '@/lib/seo/json-ld-escape';
import {
  AUTHOR_BIO,
  AUTHOR_JOB_TITLES,
  AUTHOR_NAME,
  AUTHOR_SAME_AS,
  AUTHOR_TOPICS,
} from '@/lib/seo/author';
import { stripEntities } from '@/lib/seo/strip-entities';
import { getModifiedDate, getPublishedDate } from '@/lib/post-dates';
import { toPostCard } from '@/lib/post-card';

export const revalidate = 86400; // Revalidate every 24 hours as fallback; webhook (/api/revalidate) handles real-time updates on publish

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchStoryBySlug(slug);
  // The client applies this segment's metadata on hydration, so a missing story
  // must carry the 404 title or the tab falls back to the home title.
  if (!result) return notFoundMetadata;

  const { story, source } = result;
  const content = story.content;
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/${slug}`;

  const title = stripEntities(content.og_title?.trim() || content.title?.trim() || story.name);
  const description = stripEntities(
    content.og_description?.trim() || content.excerpt?.trim() || ''
  );

  const isPost = source === 'posts' && content.component === 'post';
  let ogType: 'article' | 'profile' | 'website' = 'website';
  if (isPost) ogType = 'article';
  else if (slug === 'about') ogType = 'profile';

  // Advertise the machine-readable markdown variant on posts only; non-post
  // pages have no `/{slug}.md` route, so the alternate would 404 (RT#14).
  const alternates: Metadata['alternates'] = {
    canonical: `/${slug}`,
    ...(isPost && { types: { 'text/markdown': `/${slug}.md` } }),
  };

  const metadata: Metadata = {
    title,
    description,
    alternates,
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
    const datePublished = getPublishedDate(story);
    const dateModified = getModifiedDate(story);
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

export default async function DynamicPage({ params }: Readonly<PageProps>) {
  const { slug } = await params;

  const result = await fetchStoryBySlug(slug);
  if (!result) {
    console.error(`Error fetching story for slug: ${slug}`);
    notFound();
  }

  const { story, source } = result;
  const siteUrl = getSiteUrl();

  if (source === 'posts' && story.content.component === 'post') {
    const datePublished = getPublishedDate(story);
    const dateModified = getModifiedDate(story);
    const title = stripEntities(story.content.title?.trim() || story.name);
    const description = stripEntities(story.content.excerpt?.trim() || '');

    // Single source of truth (Phase 1 serializer): prose feeds articleBody and
    // wordCount; code samples become SoftwareSourceCode nodes. No second traversal.
    const { prose, codeSamples } = extractPostContent(story.content.body);
    const wordCount = estimateWordCount(prose);

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
      articleBody: prose || undefined,
      codeSamples: codeSamples.length > 0 ? codeSamples : undefined,
    });

    // Read the census once at the page boundary and precompute link decisions
    // for this post's tags (RT#5 — `Post` stays sync, never fetches). On a
    // census failure, degrade every pill to a plain `<span>` (fail-open, RT#6):
    // this render path has no `error.tsx`, so a transient blip must not 500.
    const censusResult = await getTagCensus();
    const tagLinks = censusResult.ok
      ? buildTagLinks(censusResult.census, story.tag_list ?? [])
      : undefined;
    const relatedPosts = censusResult.ok
      ? selectRelatedPosts(censusResult.census, censusResult.posts, story)
      : undefined;
    const related = relatedPosts && { tag: relatedPosts.tag, posts: relatedPosts.posts.map(toPostCard) };

    return (
      <div className="page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }}
        />
        <Post
          blok={story.content}
          tags={story.tag_list}
          tagLinks={tagLinks}
          createdAt={datePublished}
          related={related}
          url={`${siteUrl}/${slug}`}
        />
      </div>
    );
  }

  if (slug === 'about') {
    const blocks: StoryblokBlok[] = story.content.body ?? [];
    const hero = blocks.find((blok): blok is HeroBlockBlok => blok.component === 'hero_block');

    const personJsonLd = buildPersonJsonLd({
      siteUrl,
      name: AUTHOR_NAME,
      description: AUTHOR_BIO,
      jobTitle: AUTHOR_JOB_TITLES,
      imageUrl: hero?.image?.filename || undefined,
      knowsAbout: AUTHOR_TOPICS,
      sameAs: AUTHOR_SAME_AS,
    });

    return (
      <div className="page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(personJsonLd) }}
        />
        <StoryblokStory story={story} />
        <AuthorProfile />
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

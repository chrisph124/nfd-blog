import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSiteUrl } from '@/lib/storyblok';
import { getTagCensus, resolveTagName, selectPostsForTag } from '@/lib/tags';
import PostGrid from '@/components/organisms/PostGrid';
import { buildCollectionPageJsonLd } from '@/lib/seo-structured-data';
import { escapeJsonLd } from '@/lib/seo/json-ld-escape';
import type { PostBlok, StoryblokStory } from '@/types/storyblok';

// ISR house style. Note (RT#10): this is lazy regenerate-on-next-request, not a
// background hourly timer — a zero-traffic archive can stay stale until hit.
export const revalidate = 3600;

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

const postUrl = (siteUrl: string, post: StoryblokStory<PostBlok>) =>
  `${siteUrl}/${post.full_slug.replace(/^posts\//, '')}`;

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const result = await getTagCensus();
  if (!result.ok) return {};

  const name = resolveTagName(result.census, tag);
  if (!name) return {};

  const siteUrl = getSiteUrl();
  const title = `${name} — Articles & Notes`;
  const description = `Every post tagged ${name} on Notes of Dev — frontend engineering, AI, and headless CMS notes.`;

  return {
    title,
    description,
    alternates: { canonical: `/tags/${tag}` },
    openGraph: {
      type: 'website',
      url: `${siteUrl}/tags/${tag}`,
      title,
      description,
    },
    twitter: { title, description },
  };
}

export default async function TagArchivePage({ params }: Readonly<TagPageProps>) {
  const { tag } = await params;
  const result = await getTagCensus();

  // RT#6: a census FAILURE must never be cached as a 404 on a live archive.
  // Throwing yields an uncached 500 that retries; ISR keeps serving stale on a
  // warm page. Only a genuinely resolved-null slug (unknown/thin/shrunk) 404s.
  if (!result.ok) {
    throw new Error(`Tag census unavailable while rendering /tags/${tag}`);
  }

  const name = resolveTagName(result.census, tag);
  if (!name) notFound();

  const posts = selectPostsForTag(result.census, tag);
  const siteUrl = getSiteUrl();

  const jsonLd = buildCollectionPageJsonLd({
    url: `${siteUrl}/tags/${tag}`,
    name,
    description: `Posts tagged ${name}`,
    items: posts.map((post) => ({
      url: postUrl(siteUrl, post),
      name: post.content.title?.trim() || post.name,
    })),
  });

  return (
    <div className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }}
      />
      <section className="w-full max-w-[1280px] px-4 md:px-8 lg:px-12 xl:px-5 mx-auto py-10 md:py-15 flex flex-col gap-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:underline">Home</Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <Link href="/tags" className="hover:underline">Tags</Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="font-medium text-foreground">{name}</li>
          </ol>
        </nav>

        <header className="flex flex-col gap-2">
          <h1 className="display-1 text-4xl md:text-5xl font-bold text-foreground">{name}</h1>
          <p className="text-gray-500">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </p>
        </header>

        <PostGrid posts={posts} />
      </section>
    </div>
  );
}

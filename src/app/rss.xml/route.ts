import { fetchAllPosts, getSiteUrl } from '@/lib/storyblok';
import { buildRssFeed, type FeedItem } from '@/lib/rss/build-feed';
import { stripEntities } from '@/lib/seo/strip-entities';

export const revalidate = 3600;

export async function GET() {
  const siteUrl = getSiteUrl();
  const stories = await fetchAllPosts();

  const posts: FeedItem[] = stories.map((story) => {
    const slug = story.full_slug.replace(/^posts\//, '');
    const content = story.content;
    const title = content.title?.trim() || story.name;
    const description = content.excerpt?.trim() || content.og_description?.trim() || '';
    const publishedAt = story.first_published_at || story.published_at || story.created_at;
    const modifiedAt = story.published_at || publishedAt;
    return {
      title: stripEntities(title),
      slug,
      description,
      publishedAt,
      modifiedAt,
      heroUrl: content.featured_image?.filename,
      tags: story.tag_list,
    };
  });

  const xml = buildRssFeed({
    siteUrl,
    siteName: 'Notes of Dev',
    siteDescription:
      'Thoughts on frontend engineering, AI, and building interfaces — by Hieu (Chris) Pham.',
    authorName: 'Hieu (Chris) Pham',
    posts,
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

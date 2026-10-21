import { fetchAllPosts, getSiteUrl } from '@/lib/storyblok';
import { buildRssFeed, type FeedItem } from '@/lib/rss/build-feed';
import { stripEntities } from '@/lib/seo/strip-entities';
import { getModifiedDate, getPublishedDate } from '@/lib/post-dates';
import { SITE_DESCRIPTION } from '@/lib/seo/site';

export const revalidate = 3600;

export async function GET() {
  const siteUrl = getSiteUrl();
  const stories = await fetchAllPosts();

  const posts: FeedItem[] = stories.map((story) => {
    const slug = story.full_slug.replace(/^posts\//, '');
    const content = story.content;
    const title = content.title?.trim() || story.name;
    const description = content.excerpt?.trim() || content.og_description?.trim() || '';
    const publishedAt = getPublishedDate(story);
    const modifiedAt = getModifiedDate(story);
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
      SITE_DESCRIPTION,
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

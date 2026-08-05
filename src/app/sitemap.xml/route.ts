import { fetchAllPosts, getSiteUrl, getStoryblokApi, storyblokVersion } from '@/lib/storyblok';
import { buildSitemap, type SitemapEntry } from '@/lib/sitemap/build-sitemap';
import { buildTagCensus, selectArchivedTags, selectPostsForTag } from '@/lib/tags';
import type { StoryblokLinksResponse, StoryblokStoryLink } from '@/types/storyblok';
import { stripEntities } from '@/lib/seo/strip-entities';

export const revalidate = 3600;

export async function GET() {
  const siteUrl = getSiteUrl();
  const entries: SitemapEntry[] = [
    {
      loc: siteUrl,
      changefreq: 'daily',
    },
  ];

  try {
    const storyblokApi = getStoryblokApi();

    const [linksResponse, posts] = await Promise.all([
      storyblokApi.get('cdn/links', { version: storyblokVersion }) as Promise<{
        data: StoryblokLinksResponse;
      }>,
      fetchAllPosts(),
    ]);

    const heroBySlug = new Map<string, { loc: string; title?: string }>();
    for (const story of posts) {
      const slug = story.full_slug.replace(/^posts\//, '');
      const filename = story.content.featured_image?.filename;
      if (filename) {
        heroBySlug.set(slug, {
          loc: filename,
          title: stripEntities(story.content.title?.trim() || story.name),
        });
      }
    }

    const links = Object.values(linksResponse.data.links) as StoryblokStoryLink[];
    const dynamicEntries = links
      .filter(
        (link) =>
          !link.is_folder &&
          link.slug !== 'home' &&
          !link.slug.startsWith('global/') &&
          link.published_at !== null
      )
      .map((link): SitemapEntry => {
        const slug = link.slug.replace(/^posts\//, '');
        const hero = heroBySlug.get(slug);
        return {
          loc: `${siteUrl}/${slug}`,
          lastmod: link.published_at ?? undefined,
          changefreq: 'monthly',
          images: hero ? [hero] : undefined,
        };
      });

    entries.push(...dynamicEntries);

    // Tag taxonomy (RT#12): derive the `/tags` hub + one entry per archived tag
    // from the SAME `posts` already fetched — a pure census, no second network
    // call. Same threshold/order as the archive pages, so a slug in the sitemap
    // always resolves. Thin tags are excluded. Kept inside the try/catch so an
    // upstream failure degrades to the static/dynamic entries above.
    const tagCensus = buildTagCensus(posts);
    const archivedTags = selectArchivedTags(tagCensus);
    entries.push({ loc: `${siteUrl}/tags`, changefreq: 'weekly' });
    for (const tag of archivedTags) {
      const newest = selectPostsForTag(tagCensus, tag.slug)[0];
      entries.push({
        loc: `${siteUrl}/tags/${tag.slug}`,
        lastmod: newest?.published_at ?? newest?.first_published_at ?? undefined,
        changefreq: 'weekly',
      });
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  const xml = buildSitemap({ entries });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

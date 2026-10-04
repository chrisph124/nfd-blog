import { fetchAllPosts, getSiteUrl, getStoryblokApi, storyblokVersion } from '@/lib/storyblok';
import { buildSitemap, type SitemapEntry } from '@/lib/sitemap/build-sitemap';
import { buildTagCensus, selectArchivedTags, selectPostsForTag } from '@/lib/tags';
import type { StoryblokLinksResponse, StoryblokStoryLink } from '@/types/storyblok';
import { stripEntities } from '@/lib/seo/strip-entities';

export const revalidate = 3600;

// Served at the public `/sitemap.xml` through a rewrite in `src/proxy.ts`.
// A route at Next's reserved metadata path is frozen as a static asset on Vercel,
// so `revalidate` never took effect there.
export async function GET() {
  const siteUrl = getSiteUrl();
  const home: SitemapEntry = { loc: siteUrl, changefreq: 'daily' };
  const entries: SitemapEntry[] = [home];

  try {
    const storyblokApi = getStoryblokApi();

    const [linksResponse, posts] = await Promise.all([
      storyblokApi.get('cdn/links', { version: storyblokVersion }) as Promise<{
        data: StoryblokLinksResponse;
      }>,
      fetchAllPosts(),
    ]);

    // `published_at` was bulk-reset when posts were retagged and `cdn/links` no
    // longer returns it, so `first_published_at` is the only truthful post date.
    // `fetchAllPosts` sorts newest first.
    const newestPostDate = posts[0]?.first_published_at ?? undefined;
    home.lastmod = newestPostDate;

    const firstPublishedByFullSlug = new Map(
      posts.map((story) => [story.full_slug, story.first_published_at ?? undefined])
    );
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
          lastmod: firstPublishedByFullSlug.get(link.slug),
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
    entries.push({ loc: `${siteUrl}/tags`, lastmod: newestPostDate, changefreq: 'weekly' });
    for (const tag of archivedTags) {
      const newest = selectPostsForTag(tagCensus, tag.slug)[0];
      entries.push({
        loc: `${siteUrl}/tags/${tag.slug}`,
        lastmod: newest?.first_published_at ?? undefined,
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

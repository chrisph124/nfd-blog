import { fetchAllPosts, getSiteUrl } from '@/lib/storyblok';
import { buildLlmsIndex, type LlmsPost } from '@/lib/llms/build-index';

export const revalidate = 3600;

export async function GET() {
  const siteUrl = getSiteUrl();
  const stories = await fetchAllPosts();

  const posts: LlmsPost[] = stories
    .filter((story) => Boolean(story.first_published_at || story.published_at))
    .map((story) => {
      const slug = story.full_slug.replace(/^posts\//, '');
      const content = story.content;
      const title = content.title?.trim() || story.name;
      const description = content.excerpt?.trim() || content.og_description?.trim() || '';
      return {
        title,
        slug,
        description,
        publishedAt: story.first_published_at || story.published_at || undefined,
      };
    });

  const body = buildLlmsIndex({
    siteName: 'Notes of Dev',
    siteUrl,
    description:
      'Thoughts on frontend engineering, AI, and building interfaces — by Hieu (Chris) Pham.',
    posts,
    aboutUrl: `${siteUrl}/about`,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

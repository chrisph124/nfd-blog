import { fetchPublishedStoryBySlug, getSiteUrl } from '@/lib/storyblok';
import { postToMarkdown } from '@/lib/llms/post-to-markdown';

// Fallback revalidation; the publish webhook (/api/revalidate) refreshes this
// surface in real time on publish/unpublish.
export const revalidate = 86400;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const { slug } = await params;

  const result = await fetchPublishedStoryBySlug(slug);
  const story = result?.story;

  // Only published posts are exposed as markdown (RT#1, RT#14). A non-post page
  // (e.g. /about.md) or an unpublished/unknown slug is a 404.
  if (!story || story.content.component !== 'post') {
    return new Response('Not Found', { status: 404 });
  }
  if (!(story.first_published_at || story.published_at)) {
    return new Response('Not Found', { status: 404 });
  }

  const siteUrl = getSiteUrl();
  const markdown = postToMarkdown(story, { siteUrl });

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      // Directly reachable (excluded from the middleware matcher) → keep it out
      // of the index and point crawlers at the pretty `.md` URL (RT#10).
      'X-Robots-Tag': 'noindex',
      Link: `<${siteUrl}/${slug}.md>; rel="canonical"`,
    },
  });
}

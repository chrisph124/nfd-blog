import { fetchAllPosts, getSiteUrl } from '@/lib/storyblok';
import { postToMarkdown } from '@/lib/llms/post-to-markdown';

export const revalidate = 3600;

// Cap the concatenation so the response stays under Vercel's payload/timeout
// limits (RT#12). Older posts remain individually reachable at /{slug}.md.
const MAX_POSTS = 50;

export async function GET(): Promise<Response> {
  const siteUrl = getSiteUrl();
  const published = (await fetchAllPosts()).filter((story) =>
    Boolean(story.first_published_at || story.published_at),
  );

  const capped = published.slice(0, MAX_POSTS);
  const sections = capped.map((story) => postToMarkdown(story, { siteUrl }));
  let body = sections.join('\n\n---\n\n');

  const overflow = published.length - capped.length;
  if (overflow > 0) {
    body += `\n\n---\n\n# [truncated — ${overflow} older post(s) omitted; see each /{slug}.md]\n`;
  } else if (body.length > 0) {
    body += '\n';
  }

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

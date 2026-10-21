/**
 * IndexNow tells Bing (and through it ChatGPT search, Copilot and DuckDuckGo), Yandex and other
 * participating engines that a URL changed, so they recrawl it within minutes. The key is public
 * by design: search engines verify it against `public/<key>.txt`.
 */
export const INDEXNOW_KEY = '003f31300ab43cd486b6637e81b3909f';

const SITE_ORIGIN = 'https://www.notesof.dev';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** Maps a Storyblok `full_slug` to its public URL; shared global stories have no page of their own. */
export function storySlugToUrl(fullSlug: string): string | null {
  if (fullSlug.startsWith('global/')) return null;
  if (fullSlug === 'home' || fullSlug === '') return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}/${fullSlug.replace(/^posts\//, '')}`;
}

/**
 * Submits the changed page plus the sitemap. Only production pings, so previews never announce
 * URLs that do not exist on the live site. Failures are logged and never fail the publish webhook.
 */
export async function notifyIndexNow(fullSlug: string | undefined): Promise<void> {
  if (process.env.VERCEL_ENV !== 'production' || !fullSlug) return;
  const pageUrl = storySlugToUrl(fullSlug);
  if (!pageUrl) return;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(SITE_ORIGIN).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
        urlList: [pageUrl, `${SITE_ORIGIN}/sitemap.xml`],
      }),
      cache: 'no-store',
    });
    if (!response.ok) console.error('[indexnow]', response.status, pageUrl);
  } catch (error) {
    console.error('[indexnow]', error);
  }
}

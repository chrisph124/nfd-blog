/** Every Storyblok CDN response sits in Next's data cache under this tag; the publish webhook expires it. */
export const STORYBLOK_CACHE_TAG = 'storyblok';

/**
 * Options shared by every server-side Storyblok client.
 *
 * - `cv: 'manual'`: in `'auto'` mode the client pins the first content version it sees onto every
 *   later request. Next's data cache keys on that URL, so a warm instance (or a fresh build reusing
 *   `.next/cache`) kept returning the old content after a publish.
 * - The tagged `fetch` lets the webhook expire all cached Storyblok responses at once.
 */
export const storyblokApiOptions = {
  region: 'eu',
  cache: { cv: 'manual' as const },
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, { ...init, next: { ...init?.next, tags: [STORYBLOK_CACHE_TAG] } }),
};

import type { NextRequest } from 'next/server';
import { fetchStoryApi, fetchStoryBySlugApi } from '@/lib/storyblok-api';
import type { StoryblokAsset, PostBlok } from '@/types/storyblok';

export const runtime = 'edge';

// Permitted slug shape: lowercase letters, digits, hyphens, optional nested `/`.
// Anything else falls through to the default OG card — prevents reflected probes.
const SAFE_SLUG = /^[a-z0-9/-]+$/;
const MAX_SLUG_LENGTH = 200;

function isSafeSlug(slug: string): boolean {
  return slug.length <= MAX_SLUG_LENGTH && SAFE_SLUG.test(slug);
}

// Storyblok returns `{id: null, filename: '', ...}` (truthy) for empty asset fields,
// so we must check `.filename` directly — an object-truthy check would short-circuit
// an `||` fallback chain on empty assets.
function getImage(asset: StoryblokAsset | undefined): string | undefined {
  return asset?.filename || undefined;
}

// Route used to render via `next/og` (Satori) which always emits PNG and produced
// 500 KB–1 MB outputs. We now 302-redirect to the Storyblok image-service jpg so
// social scrapers download the compressed source directly (~80–200 KB typical).
export function optimizeStoryblokAsset(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (!url.includes('a.storyblok.com')) return url;
  if (url.includes('/m/')) return url;
  return `${url}/m/1200x630/filters:quality(75):format(jpg)`;
}

async function resolveImage(slug: string): Promise<string | undefined> {
  if (slug === 'home') {
    const story = await fetchStoryApi('home');
    return getImage(story?.content.og_image as StoryblokAsset | undefined);
  }

  const story = await fetchStoryBySlugApi(slug);
  if (story) {
    const content = story.content as PostBlok;
    return (
      getImage(content.og_image as StoryblokAsset | undefined) ||
      getImage(content.featured_image as StoryblokAsset | undefined)
    );
  }

  const nested = await fetchStoryApi(slug);
  return getImage(nested?.content.og_image as StoryblokAsset | undefined);
}

export async function GET(request: NextRequest) {
  const rawSlug = request.nextUrl.searchParams.get('slug') || 'home';
  const slug = isSafeSlug(rawSlug) ? rawSlug : 'home';
  const resolvedImage = await resolveImage(slug);

  const defaultImage = new URL('/og-default.jpg', request.url).toString();
  const finalImage = optimizeStoryblokAsset(resolvedImage) ?? defaultImage;

  return new Response(null, {
    status: 302,
    headers: {
      Location: finalImage,
      'Cache-Control': 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400',
    },
  });
}

import { ImageResponse } from 'next/og';
import { fetchStoryApi, fetchStoryBySlugApi } from '@/lib/storyblok-api';
import type { NextRequest } from 'next/server';
import type { StoryblokAsset, PostBlok } from '@/types/storyblok';

export const runtime = 'edge';

// Storyblok returns `{id: null, filename: '', ...}` (truthy) for empty asset fields,
// so we must check `.filename` directly — an object-truthy check would short-circuit
// an `||` fallback chain on empty assets.
function getImage(asset: StoryblokAsset | undefined): string | undefined {
  return asset?.filename || undefined;
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
  const slug = request.nextUrl.searchParams.get('slug') || 'home';
  const resolvedImage = await resolveImage(slug);

  const defaultImage = new URL('/og-default.jpg', request.url).toString();
  const finalImage = resolvedImage ?? defaultImage;
  const isDefault = finalImage === defaultImage;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#0f172a' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={finalImage}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: isDefault ? 'contain' : 'cover',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
    },
  );
}

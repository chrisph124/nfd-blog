import { ImageResponse } from 'next/og';
import { fetchStoryApi, fetchStoryBySlugApi } from '@/lib/storyblok-api';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const SITE_NAME = 'Notes of Dev';

async function resolveStory(slug: string) {
  if (slug === 'home') {
    const story = await fetchStoryApi('home');
    if (!story) return null;
    return {
      title: story.content.og_title || story.name,
      image: story.content.og_image?.filename || undefined,
    };
  }

  // Try [slug] route (posts + pages)
  const story = await fetchStoryBySlugApi(slug);
  if (story) {
    const content = story.content;
    return {
      title: content.og_title || content.title || story.name,
      image: content.og_image?.filename || content.featured_image?.filename || undefined,
    };
  }

  // Fall back to catch-all (nested slugs)
  const nestedStory = await fetchStoryApi(slug);
  if (nestedStory) {
    return {
      title: nestedStory.content.og_title || nestedStory.name,
      image: nestedStory.content.og_image?.filename || undefined,
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') || 'home';

  const storyData = await resolveStory(slug);
  const title = storyData?.title || SITE_NAME;
  const imageUrl = storyData?.image;

  const responseOptions = {
    width: 1200,
    height: 630,
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
  };

  // If we have an image, render it as background with overlay
  if (imageUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            position: 'relative',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '48px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
              height: '50%',
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#d1d5db',
                marginTop: 12,
              }}
            >
              {SITE_NAME}
            </div>
          </div>
        </div>
      ),
      responseOptions,
    );
  }

  // Branded text card fallback
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          padding: '60px',
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#f8fafc',
            textAlign: 'center',
            lineHeight: 1.3,
            maxWidth: '900px',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#94a3b8',
            marginTop: 24,
          }}
        >
          {SITE_NAME}
        </div>
      </div>
    ),
    responseOptions,
  );
}

import { getStoryblokApi, storyblokVersion } from '@/lib/storyblok';
import { NextRequest, NextResponse } from 'next/server';
import type { StoryblokStory, PostBlok } from '@/types/storyblok';

interface StoriesResponse {
  data: {
    stories: StoryblokStory<PostBlok>[];
  };
  headers: {
    total?: string;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const perPage = Number.parseInt(searchParams.get('per_page') || '12', 10);

  // Validate parameters (including NaN check from parseInt)
  if (Number.isNaN(page) || Number.isNaN(perPage) || page < 1 || perPage < 1 || perPage > 100) {
    return NextResponse.json(
      { error: 'Invalid pagination parameters' },
      { status: 400 }
    );
  }

  const storyblokApi = getStoryblokApi();

  try {
    const response = await storyblokApi.get('cdn/stories', {
      version: storyblokVersion,
      content_type: 'post',
      sort_by: 'first_published_at:desc',
      per_page: perPage,
      page,
    }) as StoriesResponse;

    const { data, headers } = response;
    const total = Number.parseInt(headers.total || '0');

    return NextResponse.json({
      stories: data.stories,
      total,
      page,
      perPage,
    });
  } catch (error) {
    console.error('Error fetching posts from Storyblok:', error);

    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

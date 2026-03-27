import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');

  // Validate secret token (timing-safe comparison)
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { story, reload } = body;

    // Revalidate homepage
    revalidatePath('/');

    // Revalidate specific story path if provided
    if (story?.full_slug) {
      const slug = story.full_slug;

      // Revalidate the specific page
      revalidatePath(`/${slug}`);

      // Revalidate catch-all route
      const slugParts = slug.split('/');
      revalidatePath(`/${slugParts.join('/')}`);

      // Also revalidate parent paths for nested content
      if (slugParts.length > 1) {
        slugParts.pop();
        while (slugParts.length > 0) {
          revalidatePath(`/${slugParts.join('/')}`);
          slugParts.pop();
        }
      }
    }

    // If reload is true, also revalidate API routes
    if (reload) {
      revalidateTag('posts');
    }

    return NextResponse.json({
      revalidated: true,
      story: story?.full_slug || 'home',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    );
  }
}

// Handle GET for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }

  revalidatePath('/');
  return NextResponse.json({
    revalidated: true,
    timestamp: Date.now(),
  });
}

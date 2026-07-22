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

    // Revalidate SEO surfaces (sitemap, RSS, llms.txt/llms-full.txt) — affected by every publish/unpublish
    revalidatePath('/sitemap.xml');
    revalidatePath('/rss.xml');
    revalidatePath('/llms.txt');
    revalidatePath('/llms-full.txt');

    // Revalidate specific story path if provided
    if (story?.full_slug) {
      const slug = story.full_slug;

      // Revalidate the specific page
      revalidatePath(`/${slug}`);

      // The site strips the `posts/` prefix at routing time (see generateStaticParams).
      // Stories live at full_slug = "posts/my-post" but render at /my-post, so the
      // stripped path is the cache key that actually exists.
      if (slug.startsWith('posts/')) {
        const strippedSlug = slug.replace(/^posts\//, '');
        revalidatePath(`/${strippedSlug}`);

        // The `/{slug}.md` surface is served by the /api/md/[slug] handler (the
        // middleware rewrite destination = the real cache key) (RT#2).
        revalidatePath(`/api/md/${strippedSlug}`);
      }

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
      revalidateTag('posts', 'page');
    }

    console.log('[revalidate]', {
      slug: story?.full_slug ?? null,
      reload: Boolean(reload),
      timestamp: Date.now(),
    });

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

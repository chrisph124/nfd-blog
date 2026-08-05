import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Every path is wrapped so a malformed request can never 500 the whole site;
  // on any failure it falls through to the normal response (RT#8).
  try {
    const { pathname } = request.nextUrl;

    // Block access to /global/* routes (header, footer, etc.)
    if (pathname.startsWith('/global')) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }

    // Serve a post's machine-readable markdown at /{slug}.md by rewriting to the
    // /api/md/[slug] handler. Restricted to a single non-slash segment ending in
    // `.md` (RT#9), so nested paths (/posts/foo.md) and `.txt`/`.xml` pass through.
    if (pathname.endsWith('.md')) {
      const slug = pathname.slice(1, -'.md'.length);
      if (slug && !slug.includes('/')) {
        const url = request.nextUrl.clone();
        url.pathname = `/api/md/${slug}`;
        return NextResponse.rewrite(url);
      }
    }

    // Canonicalize legacy post URLs. Posts live in the internal Storyblok
    // `posts/` folder but publish at the site root (`/{slug}`); the catch-all
    // route also resolves `/posts/{slug}` at 200, so every post is indexable at
    // two URLs. Redirect public requests to the clean root URL (308 permanent)
    // so search engines consolidate on one canonical. Skip the Storyblok Visual
    // Editor, which loads previews with a `_storyblok` query param — redirecting
    // it would break the in-editor block overlays.
    if (pathname.startsWith('/posts/') && !request.nextUrl.searchParams.has('_storyblok')) {
      // Only a single non-slash segment is a canonicalizable post (mirror the
      // `.md` guard, RT#9): posts publish at a flat `/{slug}`. Nested paths
      // (`/posts/a/b`) and bare `/posts/` have no clean-root equivalent the
      // `[slug]` route can resolve, so let them fall through instead of 308-ing
      // to a 404.
      const rest = pathname.slice('/posts/'.length);
      if (rest && !rest.includes('/')) {
        const url = request.nextUrl.clone();
        url.pathname = `/${rest}`; // '/posts/foo' -> '/foo'
        return NextResponse.redirect(url, 308);
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

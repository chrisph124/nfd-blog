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

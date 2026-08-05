import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy, config } from '@/proxy';

const request = (path: string) => new NextRequest(new URL(`https://example.com${path}`));
const rewriteOf = (path: string) => proxy(request(path)).headers.get('x-middleware-rewrite');
const responseOf = (path: string) => proxy(request(path));
const locationOf = (path: string) => new URL(responseOf(path).headers.get('location') ?? 'https://example.com/').pathname;

describe('proxy — /{slug}.md rewrite', () => {
  it('rewrites a single-segment .md path to the markdown route', () => {
    expect(rewriteOf('/hello-world.md')).toContain('/api/md/hello-world');
    expect(rewriteOf('/2024-post.md')).toContain('/api/md/2024-post');
  });

  it('does not rewrite a nested .md path', () => {
    const rewrite = rewriteOf('/posts/foo.md');
    // Not a .md rewrite; the broad matcher just passes it through.
    expect(rewrite).toBeNull();
  });

  it('does not rewrite a bare ".md" with no slug', () => {
    expect(rewriteOf('/.md')).toBeNull();
  });

  it('leaves .txt/.xml SEO surfaces untouched', () => {
    expect(rewriteOf('/robots.txt')).toBeNull();
    expect(rewriteOf('/llms-full.txt')).toBeNull();
    expect(rewriteOf('/sitemap.xml')).toBeNull();
  });
});

describe('proxy — /posts/* canonical redirect', () => {
  it('308-redirects a /posts/{slug} URL to the clean root URL', () => {
    const res = responseOf('/posts/the-ai-agent-roi-playbook');
    expect(res.status).toBe(308);
    expect(locationOf('/posts/the-ai-agent-roi-playbook')).toBe('/the-ai-agent-roi-playbook');
  });

  it('preserves the query string through the redirect', () => {
    const location = responseOf('/posts/hello?utm_source=news').headers.get('location');
    expect(location).toContain('/hello');
    expect(location).toContain('utm_source=news');
  });

  it('canonicalizes the /posts/{slug}.md mirror to the root .md URL', () => {
    expect(responseOf('/posts/hello.md').status).toBe(308);
    expect(locationOf('/posts/hello.md')).toBe('/hello.md');
  });

  it.each([
    // Visual Editor previews load with a `_storyblok` param; redirecting would
    // break the in-editor block overlays.
    ['a Storyblok Visual Editor preview (_storyblok param)', '/posts/hello?_storyblok=123&_storyblok_tk=abc'],
    // A nested path has no flat root equivalent the single-segment `[slug]`
    // route can resolve, so 308-ing would redirect to a 404 (RT#9). All posts
    // are flat today; the guard defends a future nested slug.
    ['a nested /posts/a/b path (RT#9)', '/posts/foo/bar'],
    // A bare `/posts/` has an empty slug — a 308 would send it to the homepage.
    ['a bare /posts/ path', '/posts/'],
  ])('does NOT redirect %s', (_name, path) => {
    const res = responseOf(path);
    expect(res.status).not.toBe(308);
    expect(res.headers.get('location')).toBeNull();
  });

  it('leaves clean root URLs and non-post paths untouched', () => {
    expect(responseOf('/the-ai-agent-roi-playbook').headers.get('location')).toBeNull();
    expect(responseOf('/about').headers.get('location')).toBeNull();
    // `/posts` with no trailing slug is not a duplicate post URL.
    expect(responseOf('/posts').headers.get('location')).toBeNull();
  });
});

describe('proxy — existing behavior preserved', () => {
  it('blocks /global/* by rewriting to /404', () => {
    expect(rewriteOf('/global/header')).toContain('/404');
  });

  it('passes normal pages through', () => {
    expect(rewriteOf('/about')).toBeNull();
  });

  it('never throws on a malformed request (RT#8)', () => {
    const broken = {
      get nextUrl(): never {
        throw new Error('bad url');
      },
    } as unknown as NextRequest;
    expect(proxy(broken).headers.get('x-middleware-rewrite')).toBeNull();
  });
});

describe('proxy — matcher', () => {
  it('excludes api/_next/favicon from the matcher', () => {
    expect(config.matcher[0]).toContain('api|_next/static|_next/image|favicon.ico');
  });
});

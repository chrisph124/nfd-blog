import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy, config } from '@/proxy';

const request = (path: string) => new NextRequest(new URL(`https://example.com${path}`));
const rewriteOf = (path: string) => proxy(request(path)).headers.get('x-middleware-rewrite');

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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/revalidate/route';
import { NextRequest } from 'next/server';

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const createMockRequest = (secret: string, body?: Record<string, unknown>) => {
  const url = new URL('http://localhost:3000/api/revalidate');
  url.searchParams.set('secret', secret);

  return new NextRequest(url, {
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : undefined,
  });
};

describe('Revalidate API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.REVALIDATE_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('POST requests', () => {
    it('rejects requests with invalid secret', async () => {
      const request = createMockRequest('wrong-secret');

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('rejects requests without secret', async () => {
      const url = new URL('http://localhost:3000/api/revalidate');
      const request = new NextRequest(url, { method: 'POST' });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('revalidates homepage with valid secret', async () => {
      const { revalidatePath } = await import('next/cache');
      const request = createMockRequest('test-secret', {});

      await POST(request);

      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    it('revalidates specific story path when provided', async () => {
      const { revalidatePath } = await import('next/cache');
      const request = createMockRequest('test-secret', {
        story: { full_slug: 'posts/my-post' },
      });

      await POST(request);

      expect(revalidatePath).toHaveBeenCalledWith('/posts/my-post');
    });

    it('strips posts/ prefix and revalidates the rendered URL', async () => {
      const { revalidatePath } = await import('next/cache');
      const request = createMockRequest('test-secret', {
        story: { full_slug: 'posts/my-post' },
      });

      await POST(request);

      // generateStaticParams drops the posts/ segment, so the cache key
      // that actually exists is /my-post — this is the bug fix.
      expect(revalidatePath).toHaveBeenCalledWith('/my-post');
    });

    it('does not strip prefix when slug is not under posts/', async () => {
      const { revalidatePath } = await import('next/cache');
      const request = createMockRequest('test-secret', {
        story: { full_slug: 'about' },
      });

      await POST(request);

      // Strip should be a no-op: only the literal slug variants get revalidated.
      // Guard against a regression where the regex matches "about" → "" → revalidatePath('/').
      const calls = (revalidatePath as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]);
      expect(calls).toContain('/about');
      expect(calls).not.toContain('');
    });

    it('revalidates SEO surfaces on every webhook call', async () => {
      const { revalidatePath } = await import('next/cache');
      const request = createMockRequest('test-secret', {
        story: { full_slug: 'posts/my-post' },
      });

      await POST(request);

      expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
      expect(revalidatePath).toHaveBeenCalledWith('/rss.xml');
      expect(revalidatePath).toHaveBeenCalledWith('/llms.txt');
    });

    it('revalidates SEO surfaces even when story is missing', async () => {
      const { revalidatePath } = await import('next/cache');
      const request = createMockRequest('test-secret', {});

      await POST(request);

      expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
      expect(revalidatePath).toHaveBeenCalledWith('/rss.xml');
      expect(revalidatePath).toHaveBeenCalledWith('/llms.txt');
    });

    it('logs a [revalidate] success line with slug and timestamp', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const request = createMockRequest('test-secret', {
        story: { full_slug: 'posts/my-post' },
        reload: true,
      });

      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[revalidate]',
        expect.objectContaining({
          slug: 'posts/my-post',
          reload: true,
          timestamp: expect.any(Number),
        })
      );
      consoleSpy.mockRestore();
    });

    it('logs null slug when story is missing', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const request = createMockRequest('test-secret', {});

      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[revalidate]',
        expect.objectContaining({ slug: null, reload: false })
      );
      consoleSpy.mockRestore();
    });

    it('revalidates parent paths for nested stories', async () => {
      const { revalidatePath } = await import('next/cache');
      const request = createMockRequest('test-secret', {
        story: { full_slug: 'posts/category/nested-post' },
      });

      await POST(request);

      expect(revalidatePath).toHaveBeenCalledWith('/posts/category/nested-post');
      expect(revalidatePath).toHaveBeenCalledWith('/posts/category');
      expect(revalidatePath).toHaveBeenCalledWith('/posts');
    });

    it('revalidates API tag when reload is true', async () => {
      const { revalidateTag } = await import('next/cache');
      const request = createMockRequest('test-secret', {
        story: { full_slug: 'home' },
        reload: true,
      });

      await POST(request);

      expect(revalidateTag).toHaveBeenCalledWith('posts', 'page');
    });

    it('returns revalidation info', async () => {
      const request = createMockRequest('test-secret', {
        story: { full_slug: 'test-post' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.revalidated).toBe(true);
      expect(data.story).toBe('test-post');
      expect(data.timestamp).toBeDefined();
    });

    it('handles missing story gracefully', async () => {
      const { revalidatePath } = await import('next/cache');
      const request = createMockRequest('test-secret', {});

      await POST(request);

      expect(revalidatePath).toHaveBeenCalledWith('/');
    });
  });

  describe('GET requests', () => {
    it('revalidates homepage with valid secret', async () => {
      const { revalidatePath } = await import('next/cache');
      const request = createMockRequest('test-secret');

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    it('rejects GET requests with invalid secret', async () => {
      const request = createMockRequest('wrong-secret');

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('returns revalidation confirmation for GET', async () => {
      const request = createMockRequest('test-secret');

      const response = await GET(request);
      const data = await response.json();

      expect(data.revalidated).toBe(true);
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('handles malformed JSON body', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const url = new URL('http://localhost:3000/api/revalidate');
      url.searchParams.set('secret', 'test-secret');
      const request = new NextRequest(url, {
        method: 'POST',
        body: 'not-json',
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(consoleSpy).toHaveBeenCalledWith('Revalidation error:', expect.any(SyntaxError));
      consoleSpy.mockRestore();
    });
  });
});

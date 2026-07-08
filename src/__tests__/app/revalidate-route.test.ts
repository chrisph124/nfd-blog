import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const revalidatePath = vi.fn();
const revalidateTag = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/revalidate/route';

const postRequest = (body: unknown) =>
  new NextRequest(new URL('https://example.com/api/revalidate?secret=test-secret'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

describe('POST /api/revalidate — new AI-legible surfaces (RT#2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REVALIDATE_SECRET = 'test-secret';
  });
  afterEach(() => {
    delete process.env.REVALIDATE_SECRET;
  });

  it('revalidates /llms-full.txt and the /api/md/{slug} surface on a post publish', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const response = await POST(postRequest({ story: { full_slug: 'posts/my-post' } }));
    expect(response.status).toBe(200);

    const paths = revalidatePath.mock.calls.map((call) => call[0]);
    expect(paths).toContain('/llms-full.txt');
    expect(paths).toContain('/api/md/my-post');
    expect(paths).toContain('/llms.txt');

    logSpy.mockRestore();
  });

  it('rejects an invalid secret', async () => {
    const req = new NextRequest(new URL('https://example.com/api/revalidate?secret=wrong'), {
      method: 'POST',
      body: '{}',
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

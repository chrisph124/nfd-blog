import { describe, it, expect, vi, afterEach } from 'vitest';

describe('storyblokVersion', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    // Reset NODE_ENV after each test
    process.env.NODE_ENV = originalNodeEnv;
    vi.resetModules();
  });

  it('returns "published" in production (default test env)', async () => {
    // vitest runs with NODE_ENV=test, which is not "development"
    const { storyblokVersion } = await import('@/lib/storyblok-version');
    expect(storyblokVersion).toBe('published');
  });

  it('returns "draft" in development', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'development';
    const { storyblokVersion } = await import('@/lib/storyblok-version');
    expect(storyblokVersion).toBe('draft');
  });
});

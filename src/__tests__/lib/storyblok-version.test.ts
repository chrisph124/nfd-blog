import { describe, it, expect, vi, afterEach } from 'vitest';

describe('storyblokVersion', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns "published" in production (default test env)', async () => {
    // vitest runs with NODE_ENV=test, which is not "development"
    const { storyblokVersion } = await import('@/lib/storyblok-version');
    expect(storyblokVersion).toBe('published');
  });

  it('returns "draft" in development', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'development');
    const { storyblokVersion } = await import('@/lib/storyblok-version');
    expect(storyblokVersion).toBe('draft');
  });
});

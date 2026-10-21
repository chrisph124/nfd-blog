import { describe, it, expect, vi, afterEach } from 'vitest';
import { STORYBLOK_CACHE_TAG, storyblokApiOptions } from '@/lib/storyblok-cache';

describe('storyblokApiOptions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tags every Storyblok fetch for the webhook and keeps the client request options', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);

    await storyblokApiOptions.fetch('https://api.storyblok.com/v2/cdn/stories/about', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.storyblok.com/v2/cdn/stories/about', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      next: { tags: [STORYBLOK_CACHE_TAG] },
    });
  });
});

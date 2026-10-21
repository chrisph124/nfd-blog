import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INDEXNOW_KEY, notifyIndexNow, storySlugToUrl } from '@/lib/indexnow';

describe('IndexNow', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('serves the key file that search engines verify', () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is built from the constant key, not input
    const file = readFileSync(join(process.cwd(), 'public', `${INDEXNOW_KEY}.txt`), 'utf8');
    expect(file.trim()).toBe(INDEXNOW_KEY);
  });

  it.each([
    ['posts/my-post', 'https://www.notesof.dev/my-post'],
    ['about', 'https://www.notesof.dev/about'],
    ['home', 'https://www.notesof.dev/'],
    ['global/header', null],
  ])('maps %s to its public URL', (slug, url) => {
    expect(storySlugToUrl(slug)).toBe(url);
  });

  it('submits the published page and the sitemap from production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');

    await notifyIndexNow('posts/my-post');

    const [endpoint, init] = fetchMock.mock.calls[0];
    expect(endpoint).toBe('https://api.indexnow.org/indexnow');
    expect(JSON.parse(init.body)).toEqual({
      host: 'www.notesof.dev',
      key: INDEXNOW_KEY,
      keyLocation: `https://www.notesof.dev/${INDEXNOW_KEY}.txt`,
      urlList: ['https://www.notesof.dev/my-post', 'https://www.notesof.dev/sitemap.xml'],
    });
  });

  it('stays silent outside production and for global stories', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    await notifyIndexNow('posts/my-post');
    vi.stubEnv('VERCEL_ENV', 'production');
    await notifyIndexNow('global/header');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never fails the webhook when IndexNow is down', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    fetchMock.mockRejectedValueOnce(new Error('network'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(notifyIndexNow('about')).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

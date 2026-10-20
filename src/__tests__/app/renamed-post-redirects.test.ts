import { describe, expect, it } from 'vitest';
import nextConfig from '../../../next.config';

describe('renamed post redirects', () => {
  it('301s each old slug, bare and under /posts, to the new post', async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    const find = (source: string) => redirects.find((r) => r.source === source);

    for (const source of [
      '/the-goldfish-problem-why-your-ai-forgets-everything-the-moment-you-close-the-tab',
      '/posts/the-goldfish-problem-why-your-ai-forgets-everything-the-moment-you-close-the-tab',
    ]) {
      expect(find(source)).toMatchObject({
        destination: '/why-your-ai-forgets-your-project',
        statusCode: 301,
      });
    }

    expect(redirects).toHaveLength(12);
    expect(redirects.every((r) => 'statusCode' in r && r.statusCode === 301)).toBe(true);
  });
});

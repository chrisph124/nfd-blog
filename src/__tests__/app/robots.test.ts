import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/storyblok', () => ({
  getSiteUrl: vi.fn(() => 'https://example.com'),
}));

import robots from '@/app/robots';

describe('robots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Every page's og:image is /api/og; X and LinkedIn crawl under `*` and render
  // no thumbnail when that URL is disallowed.
  it('lets every group fetch /api/og social images while the rest of /api/ stays disallowed', () => {
    const rules = [robots().rules].flat();

    expect(rules.map((rule) => rule.userAgent)).toContain('*');
    for (const rule of rules) {
      expect([rule.allow].flat()).toEqual(expect.arrayContaining(['/', '/api/og']));
      expect(rule.disallow).toBe('/api/');
    }
  });

  it('explicitly allows known AI bots', () => {
    const result = robots();
    const userAgents = Array.isArray(result.rules)
      ? result.rules.map((r) => r.userAgent)
      : [result.rules.userAgent];

    expect(userAgents).toContain('GPTBot');
    expect(userAgents).toContain('ClaudeBot');
    expect(userAgents).toContain('PerplexityBot');
    expect(userAgents).toContain('Google-Extended');
    expect(userAgents).toContain('CCBot');
  });

  it('includes sitemap URL derived from site URL', () => {
    const result = robots();
    expect(result.sitemap).toBe('https://example.com/sitemap.xml');
  });
});

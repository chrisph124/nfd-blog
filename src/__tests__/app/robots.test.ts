import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/storyblok', () => ({
  getSiteUrl: vi.fn(() => 'https://example.com'),
}));

import robots from '@/app/robots';

describe('robots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns wildcard rule disallowing /api/', () => {
    const result = robots();
    expect(result.rules).toContainEqual({
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    });
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

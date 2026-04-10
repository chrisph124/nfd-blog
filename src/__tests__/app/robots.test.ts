import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/storyblok', () => ({
  getSiteUrl: vi.fn(() => 'https://example.com'),
}));

import robots from '@/app/robots';

describe('robots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns valid robots.txt configuration', () => {
    const result = robots();

    expect(result).toEqual({
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: '/api/',
        },
      ],
      sitemap: 'https://example.com/sitemap.xml',
    });
  });

  it('includes sitemap URL derived from site URL', () => {
    const result = robots();

    expect(result.sitemap).toBe('https://example.com/sitemap.xml');
  });
});

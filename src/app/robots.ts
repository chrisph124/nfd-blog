import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/storyblok';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  // `/api/og` serves every page's og:image; social crawlers that are blocked
  // from it render link cards without a thumbnail.
  const allow = ['/', '/api/og'];

  return {
    rules: [
      { userAgent: '*', allow, disallow: '/api/' },
      { userAgent: 'GPTBot', allow, disallow: '/api/' },
      { userAgent: 'ClaudeBot', allow, disallow: '/api/' },
      { userAgent: 'PerplexityBot', allow, disallow: '/api/' },
      { userAgent: 'Google-Extended', allow, disallow: '/api/' },
      { userAgent: 'CCBot', allow, disallow: '/api/' },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

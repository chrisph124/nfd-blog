import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/storyblok';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/api/' },
      { userAgent: 'GPTBot', allow: '/', disallow: '/api/' },
      { userAgent: 'ClaudeBot', allow: '/', disallow: '/api/' },
      { userAgent: 'PerplexityBot', allow: '/', disallow: '/api/' },
      { userAgent: 'Google-Extended', allow: '/', disallow: '/api/' },
      { userAgent: 'CCBot', allow: '/', disallow: '/api/' },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

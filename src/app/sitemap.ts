import type { MetadataRoute } from 'next';
import { getStoryblokApi, getSiteUrl } from '@/lib/storyblok';
import { storyblokVersion } from '@/lib/storyblok-version';
import type { StoryblokLinksResponse, StoryblokStoryLink } from '@/types/storyblok';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const storyblokApi = getStoryblokApi();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  try {
    const { data } = await storyblokApi.get('cdn/links', {
      version: storyblokVersion,
    }) as { data: StoryblokLinksResponse };

    const links = Object.values(data.links) as StoryblokStoryLink[];

    const dynamicPages: MetadataRoute.Sitemap = links
      .filter((link) => !link.is_folder && link.slug !== 'home' && !link.slug.startsWith('global/'))
      .map((link) => {
        const slug = link.slug.replace(/^posts\//, '');
        return {
          url: `${siteUrl}/${slug}`,
          lastModified: link.published_at ? new Date(link.published_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        };
      });

    return [...staticPages, ...dynamicPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}

interface WebSiteJsonLdParams {
  siteUrl: string;
  siteName: string;
}

export function buildWebSiteJsonLd({ siteUrl, siteName }: WebSiteJsonLdParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
  };
}

interface BlogPostingJsonLdParams {
  siteUrl: string;
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  imageUrl?: string;
  authorName: string;
}

export function buildBlogPostingJsonLd({
  siteUrl,
  slug,
  title,
  description,
  datePublished,
  imageUrl,
  authorName,
}: BlogPostingJsonLdParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: `${siteUrl}/${slug}`,
    datePublished,
    ...(imageUrl && { image: imageUrl }),
    author: {
      '@type': 'Person',
      name: authorName,
    },
  };
}

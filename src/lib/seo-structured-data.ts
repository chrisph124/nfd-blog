interface WebSiteJsonLdParams {
  siteUrl: string;
  siteName: string;
  description?: string;
}

export function buildWebSiteJsonLd({ siteUrl, siteName, description }: WebSiteJsonLdParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    ...(description && { description }),
  };
}

interface OrganizationJsonLdParams {
  siteUrl: string;
  name?: string;
  logoUrl?: string;
}

export function buildOrganizationJsonLd({ siteUrl, name = 'Notes of Dev', logoUrl }: OrganizationJsonLdParams) {
  const logo = logoUrl ?? `${siteUrl}/og-default.jpg`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: logo,
    },
  };
}

interface BlogPostingJsonLdParams {
  siteUrl: string;
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  imageUrl?: string;
  authorName: string;
  authorUrl?: string;
  wordCount?: number;
  organizationName?: string;
  organizationLogoUrl?: string;
}

export function buildBlogPostingJsonLd({
  siteUrl,
  slug,
  title,
  description,
  datePublished,
  dateModified,
  imageUrl,
  authorName,
  authorUrl,
  wordCount,
  organizationName = 'Notes of Dev',
  organizationLogoUrl,
}: BlogPostingJsonLdParams) {
  const canonicalUrl = `${siteUrl}/${slug}`;
  const publisherLogo = organizationLogoUrl ?? `${siteUrl}/og-default.jpg`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: canonicalUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    datePublished,
    ...(dateModified && { dateModified }),
    ...(imageUrl && { image: imageUrl }),
    ...(typeof wordCount === 'number' && wordCount > 0 && { wordCount }),
    author: {
      '@type': 'Person',
      name: authorName,
      ...(authorUrl && { url: authorUrl }),
    },
    publisher: {
      '@type': 'Organization',
      name: organizationName,
      logo: {
        '@type': 'ImageObject',
        url: publisherLogo,
      },
    },
  };
}

interface PersonJsonLdParams {
  siteUrl: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sameAs?: string[];
  jobTitle?: string;
}

export function buildPersonJsonLd({
  siteUrl,
  name,
  description,
  imageUrl,
  sameAs,
  jobTitle,
}: PersonJsonLdParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: `${siteUrl}/about`,
    ...(description && { description }),
    ...(jobTitle && { jobTitle }),
    ...(imageUrl && { image: imageUrl }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
  };
}

export function estimateWordCount(text: string | undefined | null): number {
  if (!text) return 0;
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 0;
  return cleaned.split(' ').length;
}

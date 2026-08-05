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
  sameAs?: string[];
}

export function buildOrganizationJsonLd({
  siteUrl,
  name = 'Notes of Dev',
  logoUrl,
  sameAs,
}: OrganizationJsonLdParams) {
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
    ...(sameAs && sameAs.length > 0 && { sameAs }),
  };
}

/** A code unit surfaced as a `SoftwareSourceCode` node; `code` is intentionally
 *  not emitted (RT#11) — it lives losslessly at the post's `/{slug}.md`. */
interface CodeSampleInput {
  name: string;
  language: string;
}

/** Cap on inline `articleBody` — enough for rich results, avoids page bloat (RT#11). */
const ARTICLE_BODY_MAX_CHARS = 5000;

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
  articleBody?: string;
  codeSamples?: CodeSampleInput[];
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
  articleBody,
  codeSamples,
  organizationName = 'Notes of Dev',
  organizationLogoUrl,
}: BlogPostingJsonLdParams) {
  const canonicalUrl = `${siteUrl}/${slug}`;
  const publisherLogo = organizationLogoUrl ?? `${siteUrl}/og-default.jpg`;
  const trimmedBody = articleBody?.trim();

  // Each code unit points at the lossless `/{slug}.md`; `text` is omitted so the
  // inline <script> never carries a duplicate copy of every code block (RT#11).
  const hasPart = codeSamples?.map((sample) => ({
    '@type': 'SoftwareSourceCode',
    ...(sample.name && { name: sample.name }),
    ...(sample.language && { programmingLanguage: sample.language }),
    url: `${canonicalUrl}.md`,
  }));

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
    ...(trimmedBody && { articleBody: trimmedBody.slice(0, ARTICLE_BODY_MAX_CHARS) }),
    ...(hasPart && hasPart.length > 0 && { hasPart }),
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
  const cleaned = text.replaceAll(/\s+/g, ' ').trim();
  if (!cleaned) return 0;
  return cleaned.split(' ').length;
}

interface CollectionPageItem {
  url: string;
  name: string;
}

interface CollectionPageJsonLdParams {
  url: string;
  name: string;
  description?: string;
  items: CollectionPageItem[];
}

/**
 * Build `CollectionPage` JSON-LD for a listing surface (a `/tags/<slug>` archive
 * or the `/tags` hub). `mainEntity` is an ordered `ItemList` of the members —
 * posts for an archive, tag archives for the index — each a `ListItem` with a
 * URL and name. Strings are escaped at render time via `escapeJsonLd`.
 */
export function buildCollectionPageJsonLd({
  url,
  name,
  description,
  items,
}: CollectionPageJsonLdParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url,
    ...(description && { description }),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: item.url,
        name: item.name,
      })),
    },
  };
}

interface HomeJsonLdGraphParams {
  siteUrl: string;
  siteName: string;
  description?: string;
  sameAs?: string[];
}

/**
 * Build a single JSON-LD `@graph` document combining WebSite + Organization for the home page.
 *
 * Reasoning: a single inline <script> with `@graph` is preferred over multiple scripts because
 * it (a) shrinks the rendered HTML, (b) reduces parse work, and (c) lets search engines treat
 * the entities as part of the same logical graph. Per-node `@context` is dropped — the outer
 * `@context` covers the whole graph.
 */
export function buildHomeJsonLdGraph({
  siteUrl,
  siteName,
  description,
  sameAs,
}: HomeJsonLdGraphParams) {
  const website = buildWebSiteJsonLd({ siteUrl, siteName, description });
  const organization = buildOrganizationJsonLd({ siteUrl, name: siteName, sameAs });

  // Strip nested @context — the outer one covers every node in @graph.
  const stripContext = <T extends { '@context'?: string }>(node: T) => {
    const { '@context': _ctx, ...rest } = node;
    return rest;
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [stripContext(website), stripContext(organization)],
  };
}

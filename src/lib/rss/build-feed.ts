import { stripEntities } from '@/lib/seo/strip-entities';

export interface FeedItem {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  modifiedAt?: string;
  heroUrl?: string;
  heroType?: string;
  tags?: string[];
}

export interface FeedOptions {
  siteUrl: string;
  siteName: string;
  siteDescription: string;
  authorEmail?: string;
  authorName?: string;
  posts: FeedItem[];
  generatedAt?: Date;
}

function escapeXml(value: string): string {
  return value.replaceAll(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return ch;
    }
  });
}

function toRfc822(value: string | undefined, fallback: Date): string {
  const date = value ? new Date(value) : fallback;
  const safe = Number.isNaN(date.getTime()) ? fallback : date;
  return safe.toUTCString();
}

function detectMime(url: string | undefined): string {
  if (!url) return 'image/jpeg';
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.avif')) return 'image/avif';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'image/jpeg';
}

function trimDescription(input: string, max = 500): string {
  const clean = stripEntities(input).replaceAll(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function buildRssFeed(opts: FeedOptions): string {
  const { siteUrl, siteName, siteDescription, posts, authorEmail, authorName } = opts;
  const generatedAt = opts.generatedAt ?? new Date();
  const sorted = [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const lastBuildSource = sorted[0]?.modifiedAt || sorted[0]?.publishedAt;
  const lastBuildDate = toRfc822(lastBuildSource, generatedAt);

  const author =
    authorEmail && authorName
      ? `<author>${escapeXml(authorEmail)} (${escapeXml(authorName)})</author>`
      : '';

  const items = sorted
    .map((post) => {
      const link = `${siteUrl}/${post.slug}`;
      const pubDate = toRfc822(post.publishedAt, generatedAt);
      const description = trimDescription(post.description);
      const title = escapeXml(stripEntities(post.title));
      const enclosure = post.heroUrl
        ? `\n      <enclosure url="${escapeXml(post.heroUrl)}" type="${detectMime(post.heroType || post.heroUrl)}" length="0" />`
        : '';
      const categories = (post.tags ?? [])
        .map((tag) => `\n      <category>${escapeXml(tag)}</category>`)
        .join('');
      return `    <item>
      <title>${title}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>${author ? `\n      ${author}` : ''}${categories}${enclosure}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(`${siteUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

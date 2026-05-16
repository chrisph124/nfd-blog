export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  images?: Array<{ loc: string; title?: string; caption?: string }>;
}

export interface SitemapOptions {
  entries: SitemapEntry[];
  generatedAt?: Date;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
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

function isoDate(value: string | undefined, fallback: Date): string {
  if (!value) return fallback.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
}

export function buildSitemap(opts: SitemapOptions): string {
  const generatedAt = opts.generatedAt ?? new Date();

  const urls = opts.entries
    .map((entry) => {
      const lastmod = `\n    <lastmod>${isoDate(entry.lastmod, generatedAt)}</lastmod>`;
      const changefreq = entry.changefreq
        ? `\n    <changefreq>${entry.changefreq}</changefreq>`
        : '';
      const images = (entry.images ?? [])
        .map(
          (img) => `\n    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>${img.title ? `\n      <image:title>${escapeXml(img.title)}</image:title>` : ''}${img.caption ? `\n      <image:caption>${escapeXml(img.caption)}</image:caption>` : ''}
    </image:image>`
        )
        .join('');
      return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${lastmod}${changefreq}${images}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;
}

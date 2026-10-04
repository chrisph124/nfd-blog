export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  images?: Array<{ loc: string; title?: string; caption?: string }>;
}

export interface SitemapOptions {
  entries: SitemapEntry[];
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

function isoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function buildSitemap(opts: SitemapOptions): string {
  const urls = opts.entries
    .map((entry) => {
      // An unknown date is omitted rather than stamped with generation time:
      // a lastmod that moves on every regeneration teaches crawlers to ignore it.
      const lastmodIso = isoDate(entry.lastmod);
      const lastmod = lastmodIso ? `\n    <lastmod>${lastmodIso}</lastmod>` : '';
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

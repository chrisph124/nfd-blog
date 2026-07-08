import { stripEntities } from '@/lib/seo/strip-entities';

export interface LlmsPost {
  title: string;
  slug: string;
  description: string;
  publishedAt?: string;
}

export interface LlmsIndexOptions {
  siteName: string;
  siteUrl: string;
  description: string;
  posts: LlmsPost[];
  aboutUrl?: string;
}

function compactDescription(input: string, max = 160): string {
  const clean = stripEntities(input).replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function buildLlmsIndex(opts: LlmsIndexOptions): string {
  const { siteName, siteUrl, description, posts, aboutUrl } = opts;
  const sorted = [...posts].sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });

  const lines: string[] = [];
  lines.push(`# ${siteName}`);
  lines.push('');
  lines.push(`> ${compactDescription(description, 300)}`);
  lines.push('');
  lines.push('## Posts');

  if (sorted.length === 0) {
    lines.push('');
    lines.push('_No posts yet._');
  } else {
    for (const post of sorted) {
      const desc = compactDescription(post.description);
      const link = `${siteUrl}/${post.slug}`;
      const tail = desc ? `: ${desc}` : '';
      // Point AI agents at the lossless machine-readable variant alongside the page.
      lines.push(`- [${stripEntities(post.title)}](${link}) ([md](${link}.md))${tail}`);
    }
  }

  if (aboutUrl) {
    lines.push('');
    lines.push('## About');
    lines.push(`- [About the author](${aboutUrl})`);
  }

  return `${lines.join('\n')}\n`;
}

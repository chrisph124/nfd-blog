import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteUrl } from '@/lib/storyblok';
import { getTagCensus, selectArchivedTags } from '@/lib/tags';
import { buildCollectionPageJsonLd } from '@/lib/seo-structured-data';
import { escapeJsonLd } from '@/lib/seo/json-ld-escape';

export const revalidate = 3600;

const TITLE = 'Tags — Browse by Topic';
const DESCRIPTION =
  'Browse every topic on Notes of Dev — frontend engineering, AI, and headless CMS notes, grouped by tag.';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/tags' },
    openGraph: {
      type: 'website',
      url: `${siteUrl}/tags`,
      title: TITLE,
      description: DESCRIPTION,
    },
    twitter: { title: TITLE, description: DESCRIPTION },
  };
}

export default async function TagsIndexPage() {
  const result = await getTagCensus();

  // RT#6: don't cache a degraded (empty) hub on a transient census failure.
  // A genuinely empty taxonomy (ok, no archived tags) renders the empty state.
  if (!result.ok) {
    throw new Error('Tag census unavailable while rendering /tags');
  }

  const archived = selectArchivedTags(result.census);
  const siteUrl = getSiteUrl();

  const jsonLd = buildCollectionPageJsonLd({
    url: `${siteUrl}/tags`,
    name: TITLE,
    description: DESCRIPTION,
    items: archived.map((tag) => ({
      url: `${siteUrl}/tags/${tag.slug}`,
      name: tag.name,
    })),
  });

  return (
    <div className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }}
      />
      <section className="w-full max-w-[1280px] px-4 md:px-8 lg:px-12 xl:px-5 mx-auto py-10 md:py-15 flex flex-col gap-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:underline">Home</Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="font-medium text-foreground">Tags</li>
          </ol>
        </nav>

        <header className="flex flex-col gap-2">
          <h1 className="display-1 text-4xl md:text-5xl font-bold text-foreground">Tags</h1>
          <p className="text-gray-500">Browse posts by topic.</p>
        </header>

        {archived.length === 0 ? (
          <p className="text-gray-500">No tags yet — check back soon.</p>
        ) : (
          <ul className="flex flex-wrap gap-3">
            {archived.map((tag) => (
              <li key={tag.slug}>
                <Link
                  href={`/tags/${tag.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-base font-semibold text-white! no-underline! bg-viva-magenta-500 rounded-full transition-transform hover:-translate-y-0.5"
                >
                  {tag.name}
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-white text-[#BE3455] text-xs font-bold leading-none tabular-nums">
                    {tag.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

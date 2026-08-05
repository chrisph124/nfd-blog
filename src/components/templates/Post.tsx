import Image from "next/image";
import Link from "next/link";
import { StoryblokServerComponent } from "@/lib/storyblok-utils";
import { getStoryReadingTime, formatDate } from "@/lib/utils";
import ReadingProgressBar from "@/components/atoms/ReadingProgress";
import type { PostBlok } from "@/types/storyblok";
import type { TagLink } from "@/lib/tags";

// `text-white!` + `no-underline!` override the unlayered global `a:not(...)` rule
// in globals.css (link color + underline), which otherwise beats plain utilities
// on the `<Link>` (an `<a>`); harmless on the `<span>` variant.
const TAG_PILL_CLASSES =
  "px-3 py-1 text-sm font-bold text-white! no-underline! bg-viva-magenta-500 rounded-full";

interface PostProps {
  blok: PostBlok;
  tags?: string[];
  /**
   * Per-tag link decision, keyed by display name, precomputed once from the
   * census by `[slug]/page.tsx` and prop-drilled in (RT#5). `Post` stays
   * synchronous and never consults the census itself. Missing/`linkable: false`
   * → plain `<span>`; linkable → `<Link>` to the tag archive.
   */
  tagLinks?: Map<string, TagLink>;
  createdAt?: string;
}

export default function Post({ blok, tags = [], tagLinks, createdAt }: Readonly<PostProps>) {
  const { title = "", featured_image, excerpt, body } = blok;
  const readingTime = getStoryReadingTime(body);
  const formattedDate = createdAt ? formatDate(createdAt) : '';

  // Normalize to trimmed, de-duplicated display names so the pill lookup key
  // matches the census map (keyed by trimmed name in `buildTagLinks`) and a
  // whitespace variant can't render a duplicate pill.
  const displayTags = [
    ...new Set(tags.map((tag) => tag?.trim()).filter((tag): tag is string => Boolean(tag))),
  ];

  return (
    <>
      <ReadingProgressBar
        height={4}
        position="fixed"
        zIndex={40}
      />
      <article className="flex flex-col items-center gap-y-6 md:gap-y-10 pt-4">
        <header className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 xl:px-5 flex flex-col items-center gap-4 text-center">
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {displayTags.map((tag) => {
                const link = tagLinks?.get(tag);
                return link?.linkable ? (
                  <Link key={tag} href={`/tags/${link.slug}`} className={TAG_PILL_CLASSES}>
                    {tag}
                  </Link>
                ) : (
                  <span key={tag} className={TAG_PILL_CLASSES}>
                    {tag}
                  </span>
                );
              })}
            </div>
          )}

          {title && (
            <h1 className="display-1 text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-center">
              {title}
            </h1>
          )}

          {(formattedDate || readingTime) && (
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-600">
              {formattedDate && <span>{formattedDate}</span>}
              {formattedDate && readingTime && <span>•</span>}
              {readingTime && <span>{readingTime}</span>}
            </div>
          )}
        </header>

        {featured_image?.filename && (
          <figure className="w-full max-w-[1080px] mx-auto px-4 md:px-8 lg:px-12 xl:px-5">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <Image
                src={featured_image.filename}
                alt={featured_image.alt || title}
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
                priority
              />
            </div>
          </figure>
        )}

        <div className="w-full max-w-[1280px] flex flex-col items-center px-4 md:px-8 lg:px-12 xl:px-5 mx-auto gap-y-6 md:gap-y-12">
          {excerpt && (
            <h2 className="h4 italic text-center md:px-2 lg:px-4 xl:px-16">
              {excerpt}
            </h2>
          )}

          {body && body.length > 0 && (
            <section className="prose prose-lg max-w-5xl w-full overflow-hidden flex flex-col gap-y-6">
              {body.map((nestedBlok) => (
                <StoryblokServerComponent
                  blok={nestedBlok}
                  key={nestedBlok._uid}
                />
              ))}
            </section>
          )}
        </div>
      </article>
    </>
  );
}

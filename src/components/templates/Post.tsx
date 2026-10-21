import Image from "next/image";
import Link from "next/link";
import { StoryblokServerComponent } from "@/lib/storyblok-utils";
import { getStoryReadingTime, formatDate } from "@/lib/utils";
import ReadingProgressBar from "@/components/atoms/ReadingProgress";
import PostEndings, { type RelatedPostCards } from "@/components/organisms/PostEndings";
import PostActions from "@/components/molecules/PostActions";
import type { PostBlok } from "@/types/storyblok";
import type { TagLink } from "@/lib/tags";

// `!` beats the unlayered global `a:not(...)` link color and underline rule.
const TAG_PILL_CLASSES =
  "px-3 py-1 text-sm font-bold text-white! dark:text-black! no-underline! bg-viva-magenta-500 rounded-full";

interface PostProps {
  blok: PostBlok;
  tags?: string[];
  /** Precomputed by the page so Post stays synchronous and never reads the tag census. */
  tagLinks?: Map<string, TagLink>;
  createdAt?: string;
  related?: RelatedPostCards;
  /** Absolute canonical URL; page actions render only when it is known. */
  url?: string;
}

interface PostMetaProps {
  createdAt?: string;
  readingTime: string;
}

const PostMeta = ({ createdAt, readingTime }: PostMetaProps) => {
  const items = [
    createdAt && (
      <time key="published" dateTime={createdAt}>
        {formatDate(createdAt)}
      </time>
    ),
    <span key="reading">{readingTime}</span>,
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-medium text-gray-500">
      {items.map((item, index) => [
        index > 0 && (
          <span key={`separator-${index}`} aria-hidden="true">
            •
          </span>
        ),
        item,
      ])}
    </div>
  );
};

export default function Post({ blok, tags = [], tagLinks, createdAt, related, url }: Readonly<PostProps>) {
  const { title = "", featured_image, excerpt, body } = blok;
  const readingTime = getStoryReadingTime(body);

  // Trim and dedupe so names match tagLinks keys and no duplicate pill renders.
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
      <article className="flex flex-col items-center gap-y-6 md:gap-y-10">
        <header className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 xl:px-5 flex flex-col items-center gap-4 text-center">
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

          <PostMeta createdAt={createdAt} readingTime={readingTime} />

          {url && <PostActions url={url} title={title} />}
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

        <div className="w-full max-w-7xl flex flex-col items-center px-4 md:px-8 lg:px-12 xl:px-5 mx-auto gap-y-6 md:gap-y-12">
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
      <PostEndings related={related} />
    </>
  );
}

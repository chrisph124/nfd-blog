import Image from "next/image";
import { StoryblokServerComponent } from "@/lib/storyblok-utils";
import { getStoryReadingTime, formatDate } from "@/lib/utils";
import ReadingProgressBar from "@/components/atoms/ReadingProgress";
import type { PostBlok } from "@/types/storyblok";

interface PostProps {
  blok: PostBlok;
  tags?: string[];
  createdAt?: string;
}

export default function Post({ blok, tags = [], createdAt }: Readonly<PostProps>) {
  const { title = "", featured_image, excerpt, body } = blok;
  const readingTime = getStoryReadingTime(body);
  const formattedDate = createdAt ? formatDate(createdAt) : '';

  return (
    <>
      <ReadingProgressBar
        height={4}
        position="fixed"
        zIndex={40}
      />
      <article className="flex flex-col items-center gap-y-6 md:gap-y-12 pt-4">
        <header className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 xl:px-5 flex flex-col items-center gap-4 text-center">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-bold text-white uppercase bg-viva-magenta-500 rounded-full"
                >
                  {tag}
                </span>
              ))}
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
          <figure className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 xl:px-5">
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

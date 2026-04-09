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

  // Post hero heading classes (89 chars)
  const POST_HERO_HEADING_CLASSES = "display-1 text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg text-center";

  return (
    <>
      <ReadingProgressBar
        height={4}
        position="fixed"
        zIndex={40}
      />
      <article className="flex flex-col justify-center items-center gap-y-6 md:gap-y-12 -mt-10">
      <div className="relative flex items-center justify-center w-full min-h-[300px] xl:min-h-[500px] overflow-hidden">
        {/* Background Image */}
        {featured_image?.filename && (
          <Image
            src={featured_image.filename}
            alt={featured_image.alt || title}
            fill
            className="object-cover -z-10"
            sizes="(max-width: 1024px) 100vw, 896px"
            priority
          />
        )}

        {/* Dark Overlay - covers whole image */}
        <div className="absolute inset-0 bg-black/80 -z-10" />

        <div className="flex flex-col items-center gap-4 max-w-[1280px] px-4 md:px-8 lg:px-12 xl:px-5">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-bold text-white uppercase bg-white/20 backdrop-blur-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          {title && (
            <h1 className={POST_HERO_HEADING_CLASSES}>
              {title}
            </h1>
          )}

          {/* Date and Reading Time */}
          {(formattedDate || readingTime) && (
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              {formattedDate && <span>{formattedDate}</span>}
              {formattedDate && readingTime && <span>•</span>}
              {readingTime && <span>{readingTime}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-[1280px] flex flex-col justify-center items-center px-4 md:px-8 lg:px-12 xl:px-5 mx-auto gap-y-6 md:gap-y-12">
        {excerpt && (
          <h2 className="h4 italic text-center md:px-2 lg:px-4 xl:px-16">
            {excerpt}
          </h2>
        )}

        {body && body.length > 0 && (
          <section className="prose prose-lg max-w-5xl flex flex-col gap-y-6">
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

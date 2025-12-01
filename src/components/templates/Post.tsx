import Image from "next/image";
import Link from "next/link";
import { StoryblokServerComponent } from "@storyblok/react/rsc";
import type { PostBlok } from "@/types/storyblok";

interface PostProps {
  blok: PostBlok;
  tags?: string[];
}

export default function Post({ blok, tags = [] }: Readonly<PostProps>) {
  const { title = "", featured_image, excerpt, body } = blok;

  return (
    <article className="flex flex-col justify-center items-center gap-y-6 md:gap-y-12">
      <div className="relative flex items-center justify-center w-full min-h-[200px] md:min-h-[300px] overflow-hidden">
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
        <div className="absolute inset-0 bg-black/60 -z-10" />

        <div className="flex flex-col items-center gap-4 max-w-[1240px] px-6 md:px-10 lg:px-15 2xl:px-20">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/insight-hub/${tag}`}
                  className="px-3 py-1 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          {title && (
            <h1 className="display-1 text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg text-center">
              {title}
            </h1>
          )}
        </div>
      </div>

      <div className="max-w-[1240px] flex flex-col justify-center items-center px-6 md:px-10 lg:px-15 2xl:px-20 mx-auto gap-y-6 md:gap-y-12">
        {excerpt && (
          <h4 className="italic">
            {excerpt}
          </h4>
        )}

        {body && body.length > 0 && (
          <section className="prose prose-lg max-w-4xl flex flex-col gap-y-6">
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
  );
}

'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { StoryblokStory, PostBlok } from '@/types/storyblok';
import { cn, getStoryReadingTime, formatDate } from '@/lib/utils';

interface CardProps {
  story: StoryblokStory<PostBlok>;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface CardMetaProps {
  createdAt?: string;
  body?: unknown[];
}

const CardMeta = memo(({ createdAt, body }: CardMetaProps) => {
  const formattedDate = createdAt ? formatDate(createdAt) : '';
  const readingTime = getStoryReadingTime(body);

  if (!formattedDate && !readingTime) return null;

  return (
    <div className="flex items-center gap-2 text-[13px] italic text-white/80">
      {formattedDate && <span>{formattedDate}</span>}
      {formattedDate && readingTime && <span>•</span>}
      {readingTime && <span>{readingTime}</span>}
    </div>
  );
});

CardMeta.displayName = 'CardMeta';

const Card = memo(({ story, priority = false, className, style }: CardProps) => {
  const { content, full_slug, created_at } = story;
  const { featured_image, title = '', excerpt, body } = content;

  // Strip "posts/" prefix to get root-level URL (e.g., "posts/my-post" -> "my-post")
  const postSlug = full_slug.replace(/^posts\//, '');

  // Black image-poster: image fills the card, content overlays the bottom; the
  // whole card is one link and content stays in the DOM (a11y + SEO). Reveal and
  // overlay behavior live in globals.css (.post-poster*).
  return (
    <article
      className={cn(
        'post-poster group relative w-full aspect-16/10 overflow-hidden rounded-xl bg-black',
        'transition-shadow duration-200 hover:shadow-md',
        className // carries post-card-reveal from the parent
      )}
      style={style} // carries --reveal-i
    >
      <Link
        href={`/${postSlug}`}
        aria-label={title || 'Read post'}
        className="absolute inset-0 z-30"
      />

      {featured_image?.filename && (
        <Image
          src={featured_image.filename}
          alt={featured_image.alt || title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
        />
      )}

      <div className="post-poster__scrim absolute inset-x-0 bottom-0 h-2/3 pointer-events-none" />
      <div className="post-poster__overlay absolute inset-0 pointer-events-none" />

      {/* No container `gap`: a collapsed excerpt reveal must reserve no space so
          title+date stay flush at the bottom; the meta↔excerpt gap lives in the
          excerpt's `pt-2`, inside the reveal, so it collapses too. */}
      <div className="post-poster__content absolute inset-x-0 bottom-0 z-20 p-4 flex flex-col pointer-events-none">
        <div className="flex flex-col gap-2">
          {/* Important variant: the unlayered global `.h3` rule sets primary-900, which
              a layered utility can't beat — so `!` holds primary-400 in light mode. */}
          <h2 className="h3 body-1 font-semibold line-clamp-3 text-primary-400!">
            {title}
          </h2>

          <CardMeta createdAt={created_at} body={body} />
        </div>

        {excerpt && (
          // text-white/90 is theme-invariant: `.subtitle-2` sets no color, so the
          // excerpt would otherwise inherit black `--foreground` and vanish on the poster.
          <div className="post-poster__excerpt-reveal">
            <p className="post-poster__excerpt subtitle-2 line-clamp-3 xl:line-clamp-5 text-white/90 pt-2">
              {excerpt}
            </p>
          </div>
        )}
      </div>
    </article>
  );
});

Card.displayName = 'Card';

export default Card;

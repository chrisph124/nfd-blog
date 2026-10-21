'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PostCardData } from '@/lib/post-card';
import { cn, formatDate } from '@/lib/utils';

interface CardProps {
  post: PostCardData;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface CardMetaProps {
  date: string;
  readingTime: string;
}

const CardMeta = memo(({ date, readingTime }: CardMetaProps) => {
  const formattedDate = formatDate(date);

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

const Card = memo(({ post, priority = false, className, style }: CardProps) => {
  const { href, title, excerpt, image, date, readingTime } = post;

  // Reveal and overlay styles live in globals.css (.post-poster*); content stays in the DOM for a11y and SEO.
  return (
    <article
      className={cn(
        'post-poster group relative w-full aspect-16/10 overflow-hidden rounded-xl bg-black',
        'transition-shadow duration-200 hover:shadow-md',
        // overflow-hidden clips the overlay link's outline, so the focus ring is drawn on the article.
        'has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-background',
        className
      )}
      style={style}
    >
      <Link
        href={href}
        aria-label={title || 'Read post'}
        className="absolute inset-0 z-30 focus-visible:outline-none"
      />

      {image && (
        <div className="post-poster__media absolute inset-0">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 400px"
            priority={priority}
          />
        </div>
      )}

      <div className="post-poster__scrim absolute inset-x-0 bottom-0 h-2/3 pointer-events-none" />
      <div className="post-poster__overlay absolute inset-0 pointer-events-none" />

      {/* No `gap` here: the collapsed excerpt must reserve no space, so its spacing is its own `pt-2`. */}
      <div className="post-poster__content absolute inset-x-0 bottom-0 z-20 p-4 flex flex-col pointer-events-none">
        <div className="flex flex-col gap-2">
          {/* `!` beats the unlayered global `.h3` color rule. */}
          <h2 className="h3 body-1 font-semibold line-clamp-3 text-primary-400!">
            {title}
          </h2>

          <CardMeta date={date} readingTime={readingTime} />
        </div>

        {excerpt && (
          // `.subtitle-2` sets no color; without text-white/90 the excerpt inherits --foreground and vanishes.
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

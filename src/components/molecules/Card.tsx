'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { StoryblokStory, PostBlok } from '@/types/storyblok';
import { cn, getStoryReadingTime, formatDate } from '@/lib/utils';

interface CardProps {
  story: StoryblokStory<PostBlok>;
  priority?: boolean;
}

interface CardImageProps {
  image: PostBlok['featured_image'];
  title: string;
  priority?: boolean;
}

interface CardMetaProps {
  createdAt?: string;
  excerpt?: string;
  body?: unknown[];
}

const CardImage = memo(({ image, title, priority = false }: CardImageProps) => {
  if (!image?.filename) return null;

  return (
    <div className="relative aspect-16/10 w-full overflow-hidden rounded-t-xl">
      <Image
        src={image.filename}
        alt={image.alt || title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        priority={priority}
      />
    </div>
  );
});

CardImage.displayName = 'CardImage';

const CardMeta = memo(({ createdAt, body }: CardMetaProps) => {
  const formattedDate = createdAt ? formatDate(createdAt) : '';
  const readingTime = getStoryReadingTime(body);

  if (!formattedDate && !readingTime) return null;

  return (
    <div className="flex items-center gap-2 text-xs italic text-gray-600">
      {formattedDate && <span>{formattedDate}</span>}
      {formattedDate && readingTime && <span>•</span>}
      {readingTime && <span>{readingTime}</span>}
    </div>
  );
});

CardMeta.displayName = 'CardMeta';

const Card = memo(({ story, priority = false }: CardProps) => {
  const { content, full_slug, created_at } = story;
  const { featured_image, title = '', excerpt, body } = content;

  // Strip "posts/" prefix to get root-level URL (e.g., "posts/my-post" -> "my-post")
  const postSlug = full_slug.replace(/^posts\//, '');

  return (
    <article
      className={cn(
        'group relative flex flex-row md:flex-col h-full bg-background rounded-xl shadow-sm border border-gray-200',
        'transition-all duration-200 hover:shadow-md max-w-full lg:max-w-[320px] xl:max-w-full'
      )}
    >
      <Link href={`/${postSlug}`} className="block">
        <CardImage image={featured_image} title={title} priority={priority} />
      </Link>

      <div className="flex flex-col gap-2 p-4 flex-1">

        <Link href={`/${postSlug}`} className='no-underline!'>
          <h3 className="body-1 font-semibold line-clamp-3 group-hover:text-primary-700 transition-colors">
            {title}
          </h3>
        </Link>

        <CardMeta createdAt={created_at} body={body} />

        {excerpt && (
          <p className="subtitle-2 line-clamp-4 mt-auto">
            {excerpt}
          </p>
        )}
      </div>
    </article>
  );
});

Card.displayName = 'Card';

export default Card;

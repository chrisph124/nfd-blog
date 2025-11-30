'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { StoryblokStory, PostBlok } from '@/types/storyblok';
import { cn, getReadingTime, formatDate } from '@/lib/utils';

interface CardProps {
  story: StoryblokStory<PostBlok>;
}

interface CardImageProps {
  image: PostBlok['featured_image'];
  title: string;
}

interface CardTagsProps {
  tags: string[];
}

interface CardMetaProps {
  createdAt?: string;
  excerpt?: string;
}

const CardImage = memo(({ image, title }: CardImageProps) => {
  if (!image?.filename) return null;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-xl">
      <Image
        src={image.filename}
        alt={image.alt || title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />
    </div>
  );
});

CardImage.displayName = 'CardImage';

const CardTags = memo(({ tags }: CardTagsProps) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/insight-hub/${tag}`}
          className="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
});

CardTags.displayName = 'CardTags';

const CardMeta = memo(({ createdAt, excerpt }: CardMetaProps) => {
  const formattedDate = createdAt ? formatDate(createdAt) : '';
  const readingTime = excerpt ? getReadingTime(excerpt) : '';

  if (!formattedDate && !readingTime) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      {formattedDate && <span>{formattedDate}</span>}
      {formattedDate && readingTime && <span>•</span>}
      {readingTime && <span>{readingTime}</span>}
    </div>
  );
});

CardMeta.displayName = 'CardMeta';

const Card = memo(({ story }: CardProps) => {
  const { content, full_slug, tag_list, created_at } = story;
  const { featured_image, title = '', excerpt } = content;

  // Strip "posts/" prefix to get root-level URL (e.g., "posts/my-post" -> "my-post")
  const postSlug = full_slug.replace(/^posts\//, '');

  const cardContent = (
    <article
      className={cn(
        'group flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100',
        'transition-all duration-200 hover:shadow-md hover:border-gray-200'
      )}
    >
      <CardImage image={featured_image} title={title} />

      <div className="flex flex-col gap-3 p-4 flex-1">
        {tag_list && tag_list.length > 0 && <CardTags tags={tag_list} />}

        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-700 transition-colors">
          {title}
        </h3>

        <CardMeta createdAt={created_at} excerpt={excerpt} />

        {excerpt && (
          <p className="text-sm text-gray-600 line-clamp-3 mt-auto">
            {excerpt}
          </p>
        )}
      </div>
    </article>
  );

  return (
    <Link href={`/${postSlug}`} className="block h-full">
      {cardContent}
    </Link>
  );
});

Card.displayName = 'Card';

export default Card;

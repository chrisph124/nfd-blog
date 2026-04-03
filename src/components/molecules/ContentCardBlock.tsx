'use client';

import { memo } from 'react';
import { renderRichText, StoryblokServerComponent } from '@storyblok/react/rsc';
import { makeStoryblokEditable } from '@/lib/storyblok-utils';
import type { ContentCardBlockBlok } from '@/types/storyblok';
import { cn } from '@/lib/utils';
import ImageCarousel from './ImageCarousel';

interface ContentCardBlockProps {
  blok: ContentCardBlockBlok;
}

const GRADIENT_CLASSES: Record<'primary' | 'secondary', string> = {
  primary:
    'bg-[linear-gradient(135deg,var(--content-card-primary-from),var(--content-card-primary-to))]',
  secondary:
    'bg-[linear-gradient(135deg,var(--content-card-secondary-from),var(--content-card-secondary-to))]',
};

const SHADOW_CLASS = 'shadow-md dark:shadow-[0_4px_12px_rgba(255,255,255,0.08)]';

const ContentCardBlock = memo(({ blok }: ContentCardBlockProps) => {
  const {
    variant = 'primary',
    title,
    subtitle,
    description,
    cta_group,
    images,
    hide_image_mobile,
  } = blok;

  const hasImages = images && images.length > 0;

  const renderedDescription: string | null =
    typeof description === 'object' && description !== null
      ? (renderRichText(description as Parameters<typeof renderRichText>[0]) as string)
      : null;

  return (
    <article
      {...makeStoryblokEditable(blok)}
      className={cn(
        'flex h-full flex-col rounded-2xl p-6 gap-4',
        GRADIENT_CLASSES[variant as 'primary' | 'secondary'],
        SHADOW_CLASS
      )}
    >
      {title && <h3 className="text-gray-900">{title}</h3>}
      {subtitle && (
        <h5 className="text-gray-700 font-normal">{subtitle}</h5>
      )}
      {renderedDescription && (
        <div
          className="prose prose-lg max-w-none prose-headings:font-bold prose-p:text-gray-700 dark:prose-p:text-gray-200"
          dangerouslySetInnerHTML={{ __html: renderedDescription }}
        />
      )}
      {cta_group && cta_group.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          {cta_group.map((cta) => (
            <StoryblokServerComponent key={cta._uid} blok={cta} />
          ))}
        </div>
      )}
      {hasImages && (
        <ImageCarousel images={images} hideOnMobile={hide_image_mobile} />
      )}
    </article>
  );
});

ContentCardBlock.displayName = 'ContentCardBlock';

export default ContentCardBlock;

import { StoryblokServerComponent, makeStoryblokEditable } from '@/lib/storyblok-utils';
import type { ContentCardsBlok } from '@/types/storyblok';
import { cn } from '@/lib/utils';

interface ContentCardsProps {
  blok: ContentCardsBlok;
}

const GRID_COLS = {
  '5/5': 'xl:grid-cols-2',
  '6/4': 'xl:grid-cols-[6fr_4fr]',
  '4/6': 'xl:grid-cols-[4fr_6fr]',
} as const;

export default function ContentCards({ blok }: Readonly<ContentCardsProps>) {
  const blocks = blok.blocks || [];
  const isSingleBlock = blocks.length <= 1;

  const gridClasses = cn(
    'w-full max-w-[1280px] px-10 py-12 lg:px-15 xl:px-5 lg:py-15 mx-auto grid gap-4 md:gap-6',
    isSingleBlock
      ? 'grid-cols-1'
      : cn('grid-cols-1 md:grid-cols-2', GRID_COLS[blok.layout || '5/5'])
  );

  return (
    <section {...makeStoryblokEditable(blok)} className={gridClasses}>
      {blocks.map((block) => (
        <StoryblokServerComponent key={String(block._uid)} blok={block} />
      ))}
    </section>
  );
}

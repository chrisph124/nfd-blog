import { memo } from 'react';
import { StoryblokServerComponent } from '@/lib/storyblok-utils';
import type { StoryblokComponentProps, GridBlok } from "@/types/storyblok";

const Grid = memo(({ blok }: StoryblokComponentProps<GridBlok>) => {
  return (
    <div className="grid w-full max-w-[1280px] px-4 md:px-8 lg:px-12 xl:px-5 mx-auto">
        {blok.columns?.map((nestedBlok) => (
          <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
        ))}
    </div>
  );
});

Grid.displayName = 'Grid';

export default Grid;

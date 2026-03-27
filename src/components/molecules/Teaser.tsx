import { memo } from 'react';
import type { StoryblokComponentProps, TeaserBlok } from "@/types/storyblok";

const Teaser = memo(({ blok }: StoryblokComponentProps<TeaserBlok>) => {
  return (
    <div className="teaser w-full">
      <div className="max-w-[1280px] px-6 md:px-10 lg:px-15 xl:px-5 mx-auto my-6">
        <h2>{blok.headline}</h2>
      </div>
    </div>
  );
});

Teaser.displayName = 'Teaser';

export default Teaser;

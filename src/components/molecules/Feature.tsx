import { memo } from 'react';
import type { StoryblokComponentProps, FeatureBlok } from "@/types/storyblok";

const Feature = memo(({ blok }: StoryblokComponentProps<FeatureBlok>) => {
  return (
    <div className="feature w-full">
      <div className="max-w-[1280px] px-4 md:px-8 lg:px-12 xl:px-5 mx-auto my-6">
        <span>{blok.name}</span>
      </div>
    </div>
  );
});

Feature.displayName = 'Feature';

export default Feature;

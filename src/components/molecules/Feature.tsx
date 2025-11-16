import { memo } from 'react';
import type { FeatureProps } from "@/types/storyblok";

const Feature = memo(({ blok }: FeatureProps) => {
  return (
    <div className="feature w-full">
      <div className="max-w-[1240px] px-6 md:px-10 lg:px-15 2xl:px-20 mx-auto my-6">
        <span>{blok.name}</span>
      </div>
    </div>
  );
});

Feature.displayName = 'Feature';

export default Feature;

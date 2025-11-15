import { StoryblokServerComponent } from '@storyblok/react/rsc';
import type { GridProps } from "@/types/storyblok";

export default function Grid({ blok }: GridProps) {
  return (
    <div className="grid w-full">
      <div className="max-w-[1240px] px-6 md:px-10 lg:px-15 2xl:px-20 mx-auto">
        {blok.columns?.map((nestedBlok) => (
          <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
        ))}
      </div>
    </div>
  );
}

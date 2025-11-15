import type { TeaserProps } from "@/types/storyblok";

export default function Teaser({ blok }: TeaserProps) {
  return (
    <div className="teaser w-full">
      <div className="max-w-[1240px] px-6 md:px-10 lg:px-15 2xl:px-20 mx-auto my-6">
        <h2>{blok.headline}</h2>
      </div>
    </div>
  );
}

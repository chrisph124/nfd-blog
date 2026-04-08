"use client";

import { memo } from "react";
import { makeStoryblokEditable, StoryblokServerComponent } from "@/lib/storyblok-utils";
import Image from "next/image";
import type { SectionWrapperBlok } from "@/types/storyblok";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  blok: SectionWrapperBlok;
}

interface SectionHeaderProps {
  heading?: string;
  navigateTo?: SectionWrapperBlok["navigate_to"];
}

const SectionHeader = memo(({ heading, navigateTo }: SectionHeaderProps) => {
  if (!heading && (!navigateTo || navigateTo.length === 0)) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
      {heading && (
        <h2 className="font-bold text-4xl leading-[48px] text-primary-900">
          {heading}
        </h2>
      )}
      {navigateTo && navigateTo.length > 0 && (
        <div className="flex items-center gap-4">
          {navigateTo.map((cta) => (
            <StoryblokServerComponent key={cta._uid} blok={cta} />
          ))}
        </div>
      )}
    </div>
  );
});

SectionHeader.displayName = "SectionHeader";

const SectionWrapper = memo(({ blok }: SectionWrapperProps) => {
  const { heading, navigate_to, childrens, background_pattern } = blok;

  const hasBackgroundPattern = !!background_pattern?.filename;

  return (
    <section
      {...makeStoryblokEditable(blok)}
      className={cn(
        "relative w-full flex flex-col gap-10 lg:gap-20 py-10 lg:py-12",
        hasBackgroundPattern && "overflow-hidden"
      )}
    >
      {hasBackgroundPattern && (
        <div className="absolute inset-0 z-0">
          <Image
            src={background_pattern.filename}
            alt=""
            fill
            className="object-cover opacity-[0.1]"
            sizes="100vw"
          />
        </div>
      )}

      <div className="w-full max-w-[1280px] relative z-10 flex flex-col gap-10 lg:gap-14 items-center px-4 md:px-8 lg:px-12 xl:px-5 mx-auto">
        <SectionHeader heading={heading} navigateTo={navigate_to} />

        {childrens && childrens.length > 0 && (
          <div className="w-full">
            {childrens.map((child) => (
              <StoryblokServerComponent key={child._uid} blok={child} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

SectionWrapper.displayName = "SectionWrapper";

export default SectionWrapper;

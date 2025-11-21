"use client";

import { memo } from "react";
import { storyblokEditable, StoryblokServerComponent } from "@storyblok/react/rsc";
import type { TabItemBlok } from "@/types/storyblok";

interface TabItemProps {
  blok: TabItemBlok;
}

const TabItem = memo(({ blok }: TabItemProps) => {
  const { content } = blok;

  return (
    <div {...storyblokEditable(blok)} className="w-full">
      {content?.map((nestedBlok) => (
        <StoryblokServerComponent key={nestedBlok._uid} blok={nestedBlok} />
      ))}
    </div>
  );
});

TabItem.displayName = "TabItem";

export default TabItem;

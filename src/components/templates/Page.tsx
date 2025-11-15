import { memo } from 'react';
import {
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';
import type { PageProps } from "@/types/storyblok";

const Page = memo(({ blok }: PageProps) => {
  return (
    <main {...storyblokEditable(blok)}>
      {blok.body?.map((nestedBlok) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </main>
  );
});

Page.displayName = 'Page';

export default Page;

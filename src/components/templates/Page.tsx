import { memo } from 'react';
import {
  makeStoryblokEditable,
  StoryblokServerComponent,
} from '@/lib/storyblok-utils';
import type { StoryblokComponentProps, PageBlok } from "@/types/storyblok";

const Page = memo(({ blok }: StoryblokComponentProps<PageBlok>) => {
  return (
    <main {...makeStoryblokEditable(blok)}>
      {blok.body?.map((nestedBlok) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </main>
  );
});

Page.displayName = 'Page';

export default Page;

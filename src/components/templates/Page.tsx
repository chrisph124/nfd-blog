import {
  storyblokEditable,
  StoryblokServerComponent,
} from '@storyblok/react/rsc';
import type { PageProps } from "@/types/storyblok";

export default function Page({ blok }: PageProps) {
  return (
    <main {...storyblokEditable(blok)}>
      {blok.body?.map((nestedBlok) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </main>
  );
}

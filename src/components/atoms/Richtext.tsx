import { renderRichText } from '@storyblok/react/rsc';
import type { RichtextBlok } from '@/types/storyblok';
import { makeStoryblokEditable } from '@/lib/storyblok-utils';

interface RichtextProps {
  blok: RichtextBlok;
}

export default function Richtext({ blok }: Readonly<RichtextProps>) {
  if (!blok.content) return null;

  // Render Storyblok rich text content
  const renderedContent = renderRichText(blok.content);

  if (!renderedContent) return null;

  // Prose typography classes (228 chars extracted to const)
  const PROSE_CLASSES = "flex flex-col gap-y-4 richtext prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 prose-a:text-primary-700 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none";

  return (
    <div
      {...makeStoryblokEditable(blok)}
      className={PROSE_CLASSES}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}

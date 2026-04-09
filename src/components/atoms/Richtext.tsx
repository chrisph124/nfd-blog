import { renderRichText, type StoryblokRichTextNode } from '@storyblok/react/rsc';
import type { RichtextBlok } from '@/types/storyblok';
import { makeStoryblokEditable } from '@/lib/storyblok-utils';
import { injectLazyLoading } from '@/lib/utils';
import RichtextReveal from '@/components/atoms/RichtextReveal';

interface RichtextProps {
  blok: RichtextBlok;
}

const PROSE_CLASSES = "w-full flex flex-col gap-y-4 richtext prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 prose-a:text-primary-700 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-code:bg-gray-200 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none";

export default function Richtext({ blok }: Readonly<RichtextProps>) {
  if (!blok.content) return null;

  const renderedContent = renderRichText(blok.content as unknown as StoryblokRichTextNode<string>);

  if (!renderedContent) return null;

  const optimizedContent = injectLazyLoading(renderedContent);

  return (
    <RichtextReveal>
      <div
        {...makeStoryblokEditable(blok)}
        className={PROSE_CLASSES}
        dangerouslySetInnerHTML={{ __html: optimizedContent }}
      />
    </RichtextReveal>
  );
}

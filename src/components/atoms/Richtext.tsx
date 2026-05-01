import { renderRichText, type StoryblokRichTextNode } from '@storyblok/react/rsc';
import type { RichtextBlok } from '@/types/storyblok';
import { makeStoryblokEditable } from '@/lib/storyblok-utils';
import { injectLazyLoading } from '@/lib/utils';
import { RICHTEXT_PROSE_CLASSES } from '@/lib/richtext-prose';
import RichtextReveal from '@/components/atoms/RichtextReveal';
import CodeBlockEnhancer from '@/components/atoms/CodeBlockEnhancer';

interface RichtextProps {
  blok: RichtextBlok;
}

export default function Richtext({ blok }: Readonly<RichtextProps>) {
  if (!blok.content) return null;

  const renderedContent = renderRichText(blok.content as unknown as StoryblokRichTextNode<string>);

  if (!renderedContent) return null;

  const optimizedContent = injectLazyLoading(renderedContent);

  return (
    <RichtextReveal>
      <CodeBlockEnhancer>
        <div
          {...makeStoryblokEditable(blok)}
          className={RICHTEXT_PROSE_CLASSES}
          dangerouslySetInnerHTML={{ __html: optimizedContent }}
        />
      </CodeBlockEnhancer>
    </RichtextReveal>
  );
}

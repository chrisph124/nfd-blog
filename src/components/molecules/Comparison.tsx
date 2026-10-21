import { renderRichText, type StoryblokRichTextNode } from '@storyblok/react/rsc';
import {
  Comparison as ComparisonRoot,
  ComparisonCard,
  ComparisonHeading,
  ComparisonBody,
} from '@/components/ui/comparison';
import { makeStoryblokEditable } from '@/lib/storyblok-utils';
import type { ComparisonBlok } from '@/types/storyblok';

export default function Comparison({ blok }: Readonly<{ blok: ComparisonBlok }>) {
  const cards = blok.columns ?? [];
  if (cards.length === 0) return null;

  return (
    <div className="my-6" {...makeStoryblokEditable(blok)}>
      {blok.title && (
        <h3 className="mb-3 text-lg font-semibold">{blok.title}</h3>
      )}
      <ComparisonRoot>
        {cards.map((card) => {
          // generate-types types richtext as string, but it is an object at runtime.
          const html = card.body
            ? renderRichText(card.body as unknown as StoryblokRichTextNode)
            : '';
          return (
            <ComparisonCard key={card._uid} tone={card.tone ?? 'neutral'}>
              {card.heading && <ComparisonHeading>{card.heading}</ComparisonHeading>}
              {html && (
                <ComparisonBody dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </ComparisonCard>
          );
        })}
      </ComparisonRoot>
    </div>
  );
}

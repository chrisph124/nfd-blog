import { renderRichText, type StoryblokRichTextNode } from '@storyblok/react/rsc';
import {
  Comparison as ComparisonRoot,
  ComparisonCard,
  ComparisonHeading,
  ComparisonBody,
} from '@/components/ui/comparison';
import { makeStoryblokEditable } from '@/lib/storyblok-utils';
import type { ComparisonBlok } from '@/types/storyblok';

/**
 * comparison blok — side-by-side pros/cons cards (the sanctioned replacement for
 * markdown comparison tables). The parent holds a `columns` array of
 * `comparison_card` children (tone + heading + richtext body) rendered in a
 * responsive grid that stacks on mobile. Server component: static content needs
 * no client interactivity, so richtext renders inline (same cast as Alert).
 */
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
          // body is a richtext object at runtime but typed `string` by
          // generate-types — the same cast Alert uses. Guard first so an empty
          // body renders no description (and renderRichText is never handed
          // undefined).
          const html = card.body
            ? renderRichText(card.body as unknown as StoryblokRichTextNode<string>)
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

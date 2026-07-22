import { renderRichText, type StoryblokRichTextNode } from '@storyblok/react/rsc';
import {
  HiOutlineInformationCircle,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { Alert as AlertRoot, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { makeStoryblokEditable } from '@/lib/storyblok-utils';
import type { AlertBlok } from '@/types/storyblok';

const ICON_MAP = {
  information: HiOutlineInformationCircle,
  attention: HiOutlineExclamationTriangle,
  checked: HiOutlineCheckCircle,
} as const;

/**
 * alert blok — a reusable filled accent card (announcement / alert / post TL;DR).
 * The accent color fills the card; icon, title, and richtext body are white for
 * contrast against the fill. Server component: a short TL;DR needs no client
 * interactivity, so it renders the richtext inline.
 */
export default function Alert({ blok }: Readonly<{ blok: AlertBlok }>) {
  const Icon = ICON_MAP[blok.icon ?? 'information'];
  const color = blok.color ?? 'emerald';
  // `??` (not `||`): an unset title defaults to 'TL;DR'; a title the editor
  // deliberately cleared to '' stays empty and hides the title row (below),
  // allowing an intentional title-less alert.
  const title = blok.title ?? 'TL;DR';
  // body is a richtext object at runtime but typed `string` by generate-types —
  // the same cast the Richtext atom uses. Guard first so an empty body renders
  // no description (and renderRichText is never handed undefined).
  const html = blok.body
    ? renderRichText(blok.body as unknown as StoryblokRichTextNode<string>)
    : '';

  return (
    <AlertRoot color={color} {...makeStoryblokEditable(blok)}>
      <Icon className="size-6 shrink-0" aria-hidden />
      <div className="flex flex-col gap-1">
        {title && <AlertTitle>{title}</AlertTitle>}
        {html && (
          <AlertDescription
            className="richtext text-white"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </AlertRoot>
  );
}

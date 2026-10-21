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

export default function Alert({ blok }: Readonly<{ blok: AlertBlok }>) {
  const Icon = ICON_MAP[blok.icon ?? 'information'];
  const color = blok.color ?? 'emerald';
  // `??` not `||`: a title cleared to '' stays empty and hides the title row.
  const title = blok.title ?? 'TL;DR';
  // generate-types types richtext as string, but it is an object at runtime.
  const html = blok.body
    ? renderRichText(blok.body as unknown as StoryblokRichTextNode)
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

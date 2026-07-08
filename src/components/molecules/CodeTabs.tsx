import { makeStoryblokEditable } from '@/lib/storyblok-utils';
import { highlightCode } from '@/lib/highlight-code';
import CodeTabsClient, { type RenderedCodeTab } from './CodeTabsClient';
import type { CodeTabsBlok } from '@/types/storyblok';

interface CodeTabsProps {
  blok: CodeTabsBlok;
}

/**
 * code_tabs blok — a first-class sibling in a post body. Highlights each tab's
 * code server-side with Shiki (keeping the highlighter out of the client bundle)
 * and hands plain HTML strings to the interactive client shell.
 */
export default async function CodeTabs({ blok }: Readonly<CodeTabsProps>) {
  const tabs = blok.tabs ?? [];
  if (tabs.length === 0) return null;

  const rendered: RenderedCodeTab[] = await Promise.all(
    tabs.map(async (tab) => ({
      uid: tab._uid,
      label: tab.label,
      filename: tab.filename,
      html: await highlightCode(tab.code ?? '', tab.language ?? 'bash'),
    }))
  );

  return (
    <div {...makeStoryblokEditable(blok)}>
      <CodeTabsClient tabs={rendered} />
    </div>
  );
}

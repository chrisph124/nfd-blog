import { makeStoryblokEditable } from '@/lib/storyblok-utils';
import { highlightCode } from '@/lib/highlight-code';
import CodeTabsClient, { type RenderedCodeTab } from './CodeTabsClient';
import type { CodeTabsBlok } from '@/types/storyblok';

interface CodeTabsProps {
  blok: CodeTabsBlok;
}

/** Highlights on the server so Shiki stays out of the client bundle. */
export default async function CodeTabs({ blok }: Readonly<CodeTabsProps>) {
  const tabs = blok.tabs ?? [];
  if (tabs.length === 0) return null;

  const rendered: RenderedCodeTab[] = await Promise.all(
    tabs.map(async (tab) => ({
      uid: tab._uid,
      label: tab.label,
      filename: tab.filename,
      language: tab.language ?? 'bash',
      html: await highlightCode(tab.code ?? '', tab.language ?? 'bash'),
    }))
  );

  return (
    <div {...makeStoryblokEditable(blok)}>
      <CodeTabsClient tabs={rendered} />
    </div>
  );
}

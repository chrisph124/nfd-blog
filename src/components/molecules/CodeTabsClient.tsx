'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CodeBlockEnhancer from '@/components/atoms/CodeBlockEnhancer';

export interface RenderedCodeTab {
  uid: string;
  label: string;
  /** Server-highlighted `pre.shiki` HTML for this tab. */
  html: string;
}

interface CodeTabsClientProps {
  tabs: RenderedCodeTab[];
}

export default function CodeTabsClient({ tabs }: Readonly<CodeTabsClientProps>) {
  if (tabs.length === 0) return null;

  return (
    // A single enhancer wraps every tab. Because each TabsContent is forceMounted,
    // all pre.shiki elements exist in the DOM at mount, so one CodeBlockEnhancer
    // wires copy/collapse across all tabs. Its ResizeObserver re-evaluates a
    // hidden tab's collapse height the first time it becomes visible.
    <CodeBlockEnhancer>
      <Tabs defaultValue={tabs[0].uid} className="my-6 gap-0">
        <TabsList className="w-fit rounded-b-none">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.uid} value={tab.uid}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent
            key={tab.uid}
            value={tab.uid}
            forceMount
            className="mt-0 data-[state=inactive]:hidden"
          >
            <div dangerouslySetInnerHTML={{ __html: tab.html }} />
          </TabsContent>
        ))}
      </Tabs>
    </CodeBlockEnhancer>
  );
}

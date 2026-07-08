'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CodeBlockEnhancer from '@/components/atoms/CodeBlockEnhancer';

export interface RenderedCodeTab {
  uid: string;
  label: string;
  /** Optional Astro-style filename shown in a header bar above the code. */
  filename?: string;
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
      {/* One dark rounded frame: tab strip + optional filename + code read as a
          single piece, instead of a floating pill above a separate code block. */}
      <div className="code-tabs my-6">
        <Tabs defaultValue={tabs[0].uid} className="gap-0">
          <TabsList className="code-tabs__list">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.uid} value={tab.uid} className="code-tabs__trigger">
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
              {tab.filename && (
                <div className="code-frame__title">{tab.filename}</div>
              )}
              <div dangerouslySetInnerHTML={{ __html: tab.html }} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </CodeBlockEnhancer>
  );
}

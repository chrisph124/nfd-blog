'use client';

import { Fragment } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CodeBlockEnhancer from '@/components/atoms/CodeBlockEnhancer';

export interface RenderedCodeTab {
  uid: string;
  label: string;
  filename?: string;
  language?: string;
  /** Server-highlighted `pre.shiki` HTML for this tab. */
  html: string;
}

interface CodeTabsClientProps {
  tabs: RenderedCodeTab[];
}

function FilenameLabel({ filename }: Readonly<{ filename: string }>) {
  // A <wbr> after each separator wraps long names so the copy button stays in view.
  // Capturing split, not lookbehind, for older Safari.
  const parts = filename.split(/([/._-])/).filter(Boolean);
  return (
    <span className="code-tabs__filename">
      {parts.map((part, i) => (
        <Fragment key={`${part}-${i}`}>
          {part}
          {/^[/._-]$/.test(part) && <wbr />}
        </Fragment>
      ))}
    </span>
  );
}

export default function CodeTabsClient({ tabs }: Readonly<CodeTabsClientProps>) {
  if (tabs.length === 0) return null;

  const fileCount = tabs.length;

  return (
    // One enhancer covers every tab: forceMount keeps each pre.shiki in the DOM.
    <CodeBlockEnhancer>
      {/* The file-count aria-label makes the multi-file example self-describing to assistive tech. */}
      <figure
        className="code-tabs my-6"
        aria-label={`Code example, ${fileCount} ${fileCount === 1 ? 'file' : 'files'}`}
      >
        <Tabs defaultValue={tabs[0].uid} className="gap-0">
          <TabsList className="code-tabs__list">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.uid} value={tab.uid} className="code-tabs__trigger">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab, index) => (
            <TabsContent
              key={tab.uid}
              value={tab.uid}
              forceMount
              className="mt-0 data-[state=inactive]:hidden"
              data-file={tab.filename || tab.label}
              data-file-index={`${index + 1}/${fileCount}`}
              data-lang={tab.language}
            >
              {/* One figure per file, since a single figure can't caption N files. */}
              <figure className="code-tabs__panel">
                {tab.filename && (
                  <figcaption className="code-frame__title">
                    <FilenameLabel filename={tab.filename} />
                  </figcaption>
                )}
                <div dangerouslySetInnerHTML={{ __html: tab.html }} />
              </figure>
            </TabsContent>
          ))}
        </Tabs>
      </figure>
    </CodeBlockEnhancer>
  );
}

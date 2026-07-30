'use client';

import { Fragment } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CodeBlockEnhancer from '@/components/atoms/CodeBlockEnhancer';

export interface RenderedCodeTab {
  uid: string;
  label: string;
  /** Optional Astro-style filename shown in a header bar above the code. */
  filename?: string;
  /** Language id, surfaced as the `data-lang` machine hint on each panel. */
  language?: string;
  /** Server-highlighted `pre.shiki` HTML for this tab. */
  html: string;
}

interface CodeTabsClientProps {
  tabs: RenderedCodeTab[];
}

// Render a filename with a <wbr> after each path separator (`/ . _ -`) so a long
// name wraps at natural boundaries instead of splitting a segment mid-word. The
// enhancer appends the copy button to the same title bar; CSS lets this label
// shrink and wrap so the button always stays in view.
function FilenameLabel({ filename }: Readonly<{ filename: string }>) {
  // Split on path separators (keeping them) and add a <wbr> after each, so a long
  // name wraps at natural boundaries instead of splitting a segment mid-word.
  // Capturing split (not lookbehind) for older-Safari compatibility.
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
    // A single enhancer wraps every tab. Because each TabsContent is forceMounted,
    // all pre.shiki elements exist in the DOM at mount, so one CodeBlockEnhancer
    // wires copy/collapse across all tabs. Its ResizeObserver re-evaluates a
    // hidden tab's collapse height the first time it becomes visible.
    <CodeBlockEnhancer>
      {/* One dark rounded frame around the whole group. `<figure>` + a file-count
          accessible name make the multi-file example self-describing to assistive
          tech. Per-file copy/collapse controls are injected by the enhancer. */}
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
              {/* Per-file inner figure so each filename is a real <figcaption>
                  tied to its own code (a single figure can't caption N files). */}
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

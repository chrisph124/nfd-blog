import { marked, type Tokens } from 'marked';
import type { MarkdownBlok } from '@/types/storyblok';
import { processRichtext } from '@/lib/richtext-pipeline';
import { RICHTEXT_PROSE_CLASSES } from '@/lib/richtext-prose';
import { escapeHtml } from '@/lib/html-escape';
import { buildCodeLabel } from '@/lib/code-frame';
import RichtextReveal from '@/components/atoms/RichtextReveal';
import CodeBlockEnhancer from '@/components/atoms/CodeBlockEnhancer';

interface MarkdownProps {
  blok: MarkdownBlok;
}

/** Matches an Astro-style `title="…"` (or single-quoted) in a fence infostring. */
const CODE_TITLE_META = /\btitle=(?:"([^"]*)"|'([^']*)')/;

/**
 * Render a fenced code block inside the macOS-terminal chrome (traffic-light
 * dots · centered label · copy button). Every fence gets the frame — the label
 * is `filename(language)` when a `title="…"` meta is present (e.g.
 * ```ts title="src/foo.ts" → `src/foo.ts(ts)`), else the language, else `text`.
 * Shiki highlighting runs later in the rehype pipeline; here we only emit
 * escaped HTML + the `language-*` class Shiki reads. Dots are drawn in CSS
 * (`.code-frame__title::before`), so no dot markup is emitted.
 */
function renderCode({ text, lang }: Tokens.Code): string {
  const language = /\S+/.exec(lang ?? '')?.[0] ?? '';
  const langClass = language ? ` class="language-${escapeHtml(language)}"` : '';
  const body = `<pre><code${langClass}>${escapeHtml(text)}</code></pre>`;

  const match = lang ? CODE_TITLE_META.exec(lang) : null;
  const title = match?.[1] ?? match?.[2];
  const label = buildCodeLabel(title, language);

  return `<figure class="code-frame"><figcaption class="code-frame__title"><span class="code-frame__label">${escapeHtml(label)}</span></figcaption>${body}</figure>`;
}

marked.use({ gfm: true, breaks: false, renderer: { code: renderCode } });

export default async function Markdown({ blok }: Readonly<MarkdownProps>) {
  if (!blok.content) return null;

  const htmlContent = await marked.parse(blok.content);
  const optimizedContent = await processRichtext(htmlContent);

  return (
    <RichtextReveal>
      <CodeBlockEnhancer>
        <div
          className={RICHTEXT_PROSE_CLASSES}
          dangerouslySetInnerHTML={{ __html: optimizedContent }}
        />
      </CodeBlockEnhancer>
    </RichtextReveal>
  );
}

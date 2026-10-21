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

const CODE_TITLE_META = /\btitle=(?:"([^"]*)"|'([^']*)')/;

// Shiki highlights later in the rehype pipeline, so emit only escaped HTML plus
// the `language-*` class it reads. The terminal dots are drawn in CSS.
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

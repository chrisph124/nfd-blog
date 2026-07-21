import { marked, type Tokens } from 'marked';
import type { MarkdownBlok } from '@/types/storyblok';
import { processRichtext } from '@/lib/richtext-pipeline';
import { RICHTEXT_PROSE_CLASSES } from '@/lib/richtext-prose';
import { escapeHtml } from '@/lib/html-escape';
import RichtextReveal from '@/components/atoms/RichtextReveal';
import CodeBlockEnhancer from '@/components/atoms/CodeBlockEnhancer';

interface MarkdownProps {
  blok: MarkdownBlok;
}

/** Matches an Astro-style `title="…"` (or single-quoted) in a fence infostring. */
const CODE_TITLE_META = /\btitle=(?:"([^"]*)"|'([^']*)')/;

/**
 * Render a fenced code block, adding an Astro-style filename header when the
 * fence carries a `title="…"` meta (e.g. ```ts title="src/foo.ts"). Shiki
 * highlighting runs later in the rehype pipeline; here we only emit escaped
 * HTML + the `language-*` class Shiki reads. Title-less fences render exactly
 * as before, so untitled blocks stay unchanged.
 */
function renderCode({ text, lang }: Tokens.Code): string {
  // Opt-in macOS-terminal chrome via a `terminal` flag word anywhere in the
  // fence infostring (e.g. ```text terminal or ```ts title="x" terminal).
  const isTerminal = lang ? /(?:^|\s)terminal(?:\s|$)/.test(lang) : false;

  const rawLanguage = (lang ?? '').split(/\s+/)[0] ?? '';
  // A bare ```terminal fence has no real language — drop the flag word so Shiki
  // renders the body as plain text (never a `language-terminal` class).
  const language = isTerminal && rawLanguage === 'terminal' ? '' : rawLanguage;
  const langClass = language ? ` class="language-${escapeHtml(language)}"` : '';
  const body = `<pre><code${langClass}>${escapeHtml(text)}</code></pre>`;

  const match = lang ? CODE_TITLE_META.exec(lang) : null;
  const title = match?.[1] ?? match?.[2];

  if (isTerminal) {
    // Header = dots (col 1) · label (col 2, centered) · copy button (col 3,
    // appended downstream by enhancePre). Always show a label — filename, else
    // uppercased language, else TEXT — so a bare ```text terminal still reads.
    const termLabel = title ?? (language ? language.toUpperCase() : 'TEXT');
    return `<figure class="code-frame code-frame--terminal"><figcaption class="code-frame__title"><span class="code-frame__dots" aria-hidden="true"></span><span class="code-frame__label">${escapeHtml(termLabel)}</span></figcaption>${body}</figure>`;
  }

  // Every code block gets a header bar so the copy button always sits up top.
  // Show the filename when given, else the language as a fallback label.
  const isBareLang = language === '' || language === 'plaintext' || language === 'text';
  const label = title ?? (isBareLang ? '' : language);

  return `<figure class="code-frame"><figcaption class="code-frame__title">${escapeHtml(label)}</figcaption>${body}</figure>`;
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

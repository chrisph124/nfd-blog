import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize from 'rehype-sanitize';
import rehypeShiki from '@shikijs/rehype';
import { richtextSanitizeSchema } from './richtext-sanitize-schema';
import { shikiRehypeOptions } from './shiki-theme';

/**
 * Allow-list of Shiki language ids accepted for CMS-authored `code_tabs`.
 * `code_tab.language` is free-text authored in Storyblok and flows into a
 * `class="language-…"` attribute in a constructed HTML string, so it is
 * validated against this set BEFORE use — never interpolated raw. Anything
 * outside the list falls back to `plaintext` (which also covers unknown langs).
 */
const ALLOWED_LANGUAGES = new Set<string>([
  'plaintext', 'text', 'txt',
  'bash', 'sh', 'shell', 'zsh', 'console', 'powershell', 'ps', 'ps1',
  'js', 'javascript', 'jsx', 'ts', 'typescript', 'tsx',
  'json', 'jsonc', 'json5',
  'html', 'xml', 'svg', 'css', 'scss', 'sass', 'less',
  'md', 'markdown', 'mdx', 'yaml', 'yml', 'toml', 'ini', 'diff', 'dockerfile', 'makefile',
  'python', 'py', 'go', 'rust', 'rs', 'java', 'kotlin', 'kt', 'swift', 'dart',
  'c', 'cpp', 'csharp', 'cs', 'php', 'ruby', 'rb', 'sql', 'graphql', 'gql',
  'vue', 'svelte', 'astro', 'prisma', 'nginx', 'http',
]);

/** Escape HTML metacharacters so `code` embeds safely in the constructed fragment. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function runPipeline(code: string, lang: string): Promise<string> {
  // Mirrors the richtext pipeline's order: parse → sanitize (shared schema) →
  // Shiki → stringify. Sanitize is mandatory: this output feeds
  // dangerouslySetInnerHTML with CMS-author-controlled input.
  const fragment = `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
  const result = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, richtextSanitizeSchema)
    .use(rehypeShiki, shikiRehypeOptions)
    .use(rehypeStringify)
    .process(fragment);
  return String(result);
}

/**
 * Highlight a single code string server-side with Shiki, producing the same
 * dual-theme `pre.shiki` markup as normal richtext code blocks. Safe for
 * dangerouslySetInnerHTML: the schema strips scripts/handlers, `lang` is
 * allow-listed, and `code` is HTML-escaped before templating.
 */
export async function highlightCode(code: string, lang: string): Promise<string> {
  const requested = (lang ?? '').trim().toLowerCase();
  const safeLang = ALLOWED_LANGUAGES.has(requested) ? requested : 'plaintext';
  const source = code ?? '';

  try {
    return await runPipeline(source, safeLang);
  } catch {
    // An allow-listed id Shiki cannot load at runtime → fall back to plaintext.
    return runPipeline(source, 'plaintext');
  }
}

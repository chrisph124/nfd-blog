import type { CodeTabBlok, CodeTabsBlok } from '@/types/storyblok';
import type { CodeSample } from './content-types';
import { fenceFor, normalizeLanguage, sanitizeFenceMeta } from './code-fence';

/** Filename wins over label as the fence title; both are sanitized (RT#4). */
const tabTitle = (tab: CodeTabBlok): string =>
  sanitizeFenceMeta(tab.filename?.trim() || tab.label?.trim() || '');

/** Serialize one `code_tab` to an Astro-style titled fenced block. */
export function codeTabToMarkdown(tab: CodeTabBlok): string {
  const code = tab.code ?? '';
  const lang = normalizeLanguage(tab.language) || 'plaintext';
  const title = tabTitle(tab);
  const meta = title ? ` title="${title}"` : '';
  const fence = fenceFor(code);
  return `${fence}${lang}${meta}\n${code}\n${fence}`;
}

/** Serialize a `code_tabs` group to ordered fenced blocks, blank-line separated. */
export function codeTabsToMarkdown(blok: CodeTabsBlok): string {
  const tabs = blok.tabs ?? [];
  if (tabs.length === 0) return '';
  return tabs.map(codeTabToMarkdown).join('\n\n');
}

/** Extract each tab as a code sample for structured data (raw, unsanitized name). */
export function codeTabsToCodeSamples(blok: CodeTabsBlok): CodeSample[] {
  return (blok.tabs ?? []).map((tab) => ({
    name: tab.filename?.trim() || tab.label?.trim() || '',
    language: normalizeLanguage(tab.language) || 'plaintext',
    code: tab.code ?? '',
  }));
}

import { describe, it, expect } from 'vitest';
import {
  codeTabsToCodeSamples,
  codeTabsToMarkdown,
} from '@/lib/llms/code-tabs-to-markdown';
import type { CodeTabBlok, CodeTabsBlok } from '@/types/storyblok';

const tab = (overrides: Partial<CodeTabBlok>): CodeTabBlok => ({
  _uid: overrides._uid ?? 't',
  component: 'code_tab',
  label: overrides.label ?? 'Tab',
  language: overrides.language,
  code: overrides.code ?? '',
  filename: overrides.filename,
});

const group = (...tabs: CodeTabBlok[]): CodeTabsBlok => ({
  _uid: 'g',
  component: 'code_tabs',
  tabs,
});

describe('codeTabsToMarkdown', () => {
  it('serializes a single tab with a filename title', () => {
    const out = codeTabsToMarkdown(
      group(tab({ language: 'ts', code: 'const x = 1;', filename: 'app.ts' })),
    );
    expect(out).toBe('```ts title="app.ts"\nconst x = 1;\n```');
  });

  it('preserves multi-tab order separated by a blank line', () => {
    const out = codeTabsToMarkdown(
      group(
        tab({ _uid: '1', language: 'ts', code: 'a', filename: 'a.ts' }),
        tab({ _uid: '2', language: 'js', code: 'b', filename: 'b.js' }),
      ),
    );
    expect(out).toBe('```ts title="a.ts"\na\n```\n\n```js title="b.js"\nb\n```');
  });

  it('falls back to label when filename is absent', () => {
    const out = codeTabsToMarkdown(group(tab({ language: 'ts', code: 'x', label: 'Config' })));
    expect(out).toContain('title="Config"');
  });

  it('uses plaintext for an unknown or missing language', () => {
    expect(codeTabsToMarkdown(group(tab({ language: 'cobol', code: 'x', filename: 'f' })))).toContain(
      '```plaintext title="f"',
    );
    expect(codeTabsToMarkdown(group(tab({ code: 'x', filename: 'f' })))).toContain(
      '```plaintext title="f"',
    );
  });

  it('returns empty string for an empty tab group', () => {
    expect(codeTabsToMarkdown(group())).toBe('');
    expect(codeTabsToMarkdown({ _uid: 'g', component: 'code_tabs' })).toBe('');
  });

  it('preserves code byte-for-byte by expanding the fence around backticks', () => {
    const code = '```js\nx\n```';
    const out = codeTabsToMarkdown(group(tab({ language: 'md', code, filename: 'r.md' })));
    expect(out).toBe('````md title="r.md"\n```js\nx\n```\n````');
  });

  it('neutralizes fence-injection via filename quotes and newlines (RT#4)', () => {
    const out = codeTabsToMarkdown(
      group(tab({ language: 'ts', code: 'x', filename: 'a"b\n```evil.ts' })),
    );
    expect(out).toContain('title="ab ```evil.ts"');
    expect(out).not.toContain('"a"b');
  });
});

describe('codeTabsToMarkdown — bare tab (fallback branches)', () => {
  it('handles a tab with no filename, label, language or code', () => {
    const bare = { _uid: 'b', component: 'code_tab' } as unknown as CodeTabBlok;
    expect(codeTabsToMarkdown(group(bare))).toBe('```plaintext\n\n```');
    expect(codeTabsToCodeSamples(group(bare))).toEqual([{ name: '', language: 'plaintext', code: '' }]);
  });
});

describe('codeTabsToCodeSamples', () => {
  it('maps each tab to name/language/code with raw name', () => {
    expect(
      codeTabsToCodeSamples(
        group(tab({ language: 'TS', code: 'const a = 1;', filename: 'app.ts' })),
      ),
    ).toEqual([{ name: 'app.ts', language: 'ts', code: 'const a = 1;' }]);
  });

  it('returns empty array for no tabs', () => {
    expect(codeTabsToCodeSamples(group())).toEqual([]);
  });
});

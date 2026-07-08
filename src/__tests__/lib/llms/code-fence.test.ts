import { describe, it, expect } from 'vitest';
import { fenceFor, normalizeLanguage, sanitizeFenceMeta } from '@/lib/llms/code-fence';

describe('normalizeLanguage', () => {
  it('returns empty string for empty/undefined input', () => {
    expect(normalizeLanguage('')).toBe('');
    expect(normalizeLanguage(undefined)).toBe('');
    expect(normalizeLanguage(null)).toBe('');
    expect(normalizeLanguage('   ')).toBe('');
  });

  it('lowercases and passes through an allow-listed id', () => {
    expect(normalizeLanguage('TS')).toBe('ts');
    expect(normalizeLanguage('JavaScript')).toBe('javascript');
  });

  it('collapses an unknown id to plaintext', () => {
    expect(normalizeLanguage('cobol')).toBe('plaintext');
  });
});

describe('fenceFor', () => {
  it('uses three backticks for code with no backtick runs', () => {
    expect(fenceFor('const x = 1;')).toBe('```');
  });

  it('grows to outlast the longest internal backtick run', () => {
    expect(fenceFor('```js\nx\n```')).toBe('````');
    expect(fenceFor('a ```` b')).toBe('`````');
  });
});

describe('sanitizeFenceMeta', () => {
  it('removes quotes and collapses newlines', () => {
    expect(sanitizeFenceMeta('a"b.ts')).toBe('ab.ts');
    expect(sanitizeFenceMeta('line1\nline2')).toBe('line1 line2');
    expect(sanitizeFenceMeta(undefined)).toBe('');
  });
});

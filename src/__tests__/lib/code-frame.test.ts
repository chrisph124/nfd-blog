import { describe, it, expect } from 'vitest';
import { buildCodeLabel } from '@/lib/code-frame';

describe('buildCodeLabel', () => {
  it('combines filename and language as "filename(language)"', () => {
    expect(buildCodeLabel('hello-world.js', 'javascript')).toBe('hello-world.js(javascript)');
    expect(buildCodeLabel('src/foo.ts', 'ts')).toBe('src/foo.ts(ts)');
  });

  it('shows the filename alone when there is no language', () => {
    expect(buildCodeLabel('Dockerfile', '')).toBe('Dockerfile');
  });

  it('shows the language alone when there is no filename', () => {
    expect(buildCodeLabel(undefined, 'markdown')).toBe('markdown');
    expect(buildCodeLabel('', 'python')).toBe('python');
  });

  it('falls back to "text" when neither is given', () => {
    expect(buildCodeLabel(undefined, '')).toBe('text');
    expect(buildCodeLabel('   ', '  ')).toBe('text');
  });

  it('trims surrounding whitespace', () => {
    expect(buildCodeLabel('  a.ts  ', '  ts  ')).toBe('a.ts(ts)');
  });
});

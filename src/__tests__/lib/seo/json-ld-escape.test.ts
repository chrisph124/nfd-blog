import { describe, it, expect } from 'vitest';
import { escapeJsonLd } from '@/lib/seo/json-ld-escape';

describe('escapeJsonLd', () => {
  it('returns JSON string for plain objects', () => {
    expect(escapeJsonLd({ a: 1, b: 'two' })).toBe('{"a":1,"b":"two"}');
  });

  it(String.raw`escapes < to \u003c so attacker-controlled strings cannot break out of <script>`, () => {
    const result = escapeJsonLd({ payload: '</script><script>alert(1)</script>' });
    expect(result).not.toContain('</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain(String.raw`\u003c/script>`);
    expect(result).toContain(String.raw`\u003cscript>`);
  });

  it('escapes every occurrence of <', () => {
    const result = escapeJsonLd({ a: '<', b: '<<', c: '<a><b>' });
    expect(result).not.toContain('<');
    expect(result.match(/\\u003c/g) ?? []).toHaveLength(5);
  });

  it('produces JSON that parses back to the original (minus < escaping)', () => {
    const input = { headline: 'Hello <world>', nested: { url: 'https://x.test/<a>' } };
    const escaped = escapeJsonLd(input);
    expect(JSON.parse(escaped)).toEqual(input);
  });
});

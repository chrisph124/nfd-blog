import { describe, it, expect } from 'vitest';
import { stripEntities } from '@/lib/seo/strip-entities';

describe('stripEntities', () => {
  it('decodes &quot; to double-quote', () => {
    expect(stripEntities('Say &quot;hi&quot;')).toBe('Say "hi"');
  });

  it('decodes &#x27; and &#39; to apostrophe', () => {
    expect(stripEntities('it&#x27;s &#39;ok&#39;')).toBe("it's 'ok'");
  });

  it('decodes &amp; to ampersand', () => {
    expect(stripEntities('A &amp; B')).toBe('A & B');
  });

  it('decodes &lt; and &gt; to angle brackets', () => {
    expect(stripEntities('&lt;tag&gt;')).toBe('<tag>');
  });

  it('decodes &nbsp; to space', () => {
    expect(stripEntities('a&nbsp;b')).toBe('a b');
  });

  it('returns empty string for null', () => {
    expect(stripEntities(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(stripEntities(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(stripEntities('')).toBe('');
  });

  it('leaves unrecognized text untouched', () => {
    expect(stripEntities('plain text — no entities')).toBe('plain text — no entities');
  });

  it('handles repeated entities in one pass', () => {
    expect(stripEntities('&amp;&amp;&amp;')).toBe('&&&');
  });
});

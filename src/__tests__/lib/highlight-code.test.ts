import { describe, it, expect } from 'vitest';
import { highlightCode } from '@/lib/highlight-code';

describe('highlightCode', () => {
  describe('Output shape (parity with richtext code blocks)', () => {
    it('produces a pre.shiki element for valid input', async () => {
      const html = await highlightCode('const x = 1;', 'ts');
      expect(html).toContain('<pre');
      expect(html).toContain('class="shiki');
    });

    it('emits dual-theme CSS variables (light + dark)', async () => {
      const html = await highlightCode('const x = 1;', 'ts');
      // defaultColor:false → colors rendered as --shiki-light / --shiki-dark vars.
      expect(html).toContain('--shiki-light');
      expect(html).toContain('--shiki-dark');
    });

    it('renders the code content', async () => {
      const html = await highlightCode('echo hello', 'bash');
      expect(html).toContain('echo');
      expect(html).toContain('hello');
    });
  });

  describe('Language handling', () => {
    it('falls back to plaintext for an unknown language without throwing', async () => {
      const html = await highlightCode('some text', 'not-a-real-language');
      expect(html).toContain('<pre');
      expect(html).toContain('class="shiki');
    });

    it('handles an empty/undefined language', async () => {
      const html = await highlightCode('plain', '');
      expect(html).toContain('<pre');
    });

    it('returns markup for empty code', async () => {
      const html = await highlightCode('', 'ts');
      expect(html).toContain('<pre');
    });
  });

  describe('XSS hardening (CMS-author-controlled input → dangerouslySetInnerHTML)', () => {
    it('does not emit a <script> tag from code content', async () => {
      const html = await highlightCode('<script>alert(1)</script>', 'js');
      expect(html).not.toMatch(/<script/i);
    });

    it('does not emit event-handler attributes injected via the language field', async () => {
      // A malicious lang tries to break out of class="language-…".
      const html = await highlightCode('x', 'bash" onmouseover="alert(1)');
      expect(html).not.toMatch(/onmouseover/i);
    });

    it('does not emit a language-* class built from a raw malicious lang', async () => {
      const html = await highlightCode('x', 'js"><img src=x onerror=alert(1)>');
      expect(html).not.toMatch(/onerror/i);
      expect(html).not.toMatch(/<img/i);
    });

    it('escapes an inline event handler embedded in the code content', async () => {
      const html = await highlightCode('<img src=x onerror="alert(1)">', 'html');
      // The payload must render as (escaped) text, never as a live element/handler.
      expect(html).not.toMatch(/<img\s/i);
    });

    it('does not allow a </code></pre> breakout from the code content', async () => {
      const html = await highlightCode('</code></pre><script>alert(1)</script>', 'ts');
      expect(html).not.toMatch(/<script/i);
    });
  });
});

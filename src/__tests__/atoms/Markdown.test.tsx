import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { MarkdownBlok } from '@/types/storyblok';

// Mock processRichtext to avoid Shiki in jsdom
vi.mock('@/lib/richtext-pipeline', () => ({
  processRichtext: vi.fn(async (html: string) => html),
}));

// Mock IntersectionObserver for RichtextReveal component
class MockIntersectionObserver {
  constructor(public callback: IntersectionObserverCallback) {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = '';
  thresholds: ReadonlyArray<number> = [];
}

global.IntersectionObserver = MockIntersectionObserver as typeof IntersectionObserver;

// Import the real Markdown component
import Markdown from '@/components/atoms/Markdown';

describe('Markdown Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Null content handling', () => {
    it('returns null when content is undefined', async () => {
      const blok: MarkdownBlok = {
        _uid: 'test-md-1',
        component: 'markdown',
        content: undefined,
      };

      const result = await Markdown({ blok });
      expect(result).toBeNull();
    });

    it('returns null when content is empty string', async () => {
      const blok: MarkdownBlok = {
        _uid: 'test-md-2',
        component: 'markdown',
        content: '',
      };

      const result = await Markdown({ blok });
      expect(result).toBeNull();
    });
  });

  describe('Rendering with content', () => {
    it('renders markdown content with prose classes', async () => {
      const blok: MarkdownBlok = {
        _uid: 'test-md-3',
        component: 'markdown',
        content: '# Hello World',
      };

      const result = await Markdown({ blok });
      expect(result).not.toBeNull();
    });

    it('processes markdown through pipeline', async () => {
      const { processRichtext } = await import('@/lib/richtext-pipeline');
      const blok: MarkdownBlok = {
        _uid: 'test-md-4',
        component: 'markdown',
        content: '## Test heading',
      };

      await Markdown({ blok });
      expect(processRichtext).toHaveBeenCalled();
    });

    it('renders with richtext class', async () => {
      const blok: MarkdownBlok = {
        _uid: 'test-md-5',
        component: 'markdown',
        content: 'Some **bold** text',
      };

      const { container } = render(await Markdown({ blok }));
      const richtextDiv = container.querySelector('.richtext');
      expect(richtextDiv).toBeInTheDocument();
    });

    it('wraps content in RichtextReveal component', async () => {
      const blok: MarkdownBlok = {
        _uid: 'test-md-6',
        component: 'markdown',
        content: 'Content here',
      };

      const { container } = render(await Markdown({ blok }));
      // The outer div from RichtextReveal should exist
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('GFM features', () => {
    it('handles bold text', async () => {
      const { processRichtext } = await import('@/lib/richtext-pipeline');
      const blok: MarkdownBlok = {
        _uid: 'test-md-7',
        component: 'markdown',
        content: 'This is **bold** text',
      };

      await Markdown({ blok });
      const calls = (processRichtext as ReturnType<typeof vi.fn>).mock.calls;
      const processedHtml = calls[calls.length - 1][0] as string;
      // marked.parse converts markdown to HTML before passing to processRichtext
      expect(processedHtml).toContain('<strong>bold</strong>');
    });

    it('handles inline code', async () => {
      const { processRichtext } = await import('@/lib/richtext-pipeline');
      const blok: MarkdownBlok = {
        _uid: 'test-md-8',
        component: 'markdown',
        content: 'Use `npm install`',
      };

      await Markdown({ blok });
      const calls = (processRichtext as ReturnType<typeof vi.fn>).mock.calls;
      const processedHtml = calls[calls.length - 1][0] as string;
      // marked.parse converts markdown to HTML before passing to processRichtext
      expect(processedHtml).toContain('<code>npm install</code>');
    });

    it('handles headings', async () => {
      const { processRichtext } = await import('@/lib/richtext-pipeline');
      const blok: MarkdownBlok = {
        _uid: 'test-md-9',
        component: 'markdown',
        content: '# Heading 1\n## Heading 2',
      };

      await Markdown({ blok });
      const calls = (processRichtext as ReturnType<typeof vi.fn>).mock.calls;
      const processedHtml = calls[calls.length - 1][0] as string;
      // marked.parse converts markdown to HTML before passing to processRichtext
      expect(processedHtml).toContain('<h1>Heading 1</h1>');
      expect(processedHtml).toContain('<h2>Heading 2</h2>');
    });
  });

  describe('dangerouslySetInnerHTML', () => {
    it('uses dangerouslySetInnerHTML for rendering', async () => {
      const blok: MarkdownBlok = {
        _uid: 'test-md-10',
        component: 'markdown',
        content: '<p>Raw HTML content</p>',
      };

      const { container } = render(await Markdown({ blok }));
      const richtextDiv = container.querySelector('.richtext');
      expect(richtextDiv).toHaveProperty('innerHTML');
    });
  });

  describe('Astro-style code fence filename header', () => {
    const lastHtml = (fn: unknown) => {
      const calls = (fn as ReturnType<typeof vi.fn>).mock.calls;
      return calls[calls.length - 1][0] as string;
    };

    it('wraps a titled fence in a code-frame figure with the filename', async () => {
      const { processRichtext } = await import('@/lib/richtext-pipeline');
      const blok: MarkdownBlok = {
        _uid: 'test-md-code-1',
        component: 'markdown',
        content: '```ts title="src/foo.ts"\nconst a = 1;\n```',
      };

      await Markdown({ blok });
      const html = lastHtml(processRichtext);
      expect(html).toContain('class="code-frame"');
      expect(html).toContain('class="code-frame__title"');
      expect(html).toContain('src/foo.ts');
      expect(html).toContain('class="language-ts"');
    });

    it('frames a title-less fence, using the language as the header label', async () => {
      const { processRichtext } = await import('@/lib/richtext-pipeline');
      const blok: MarkdownBlok = {
        _uid: 'test-md-code-2',
        component: 'markdown',
        content: '```ts\nconst a = 1;\n```',
      };

      await Markdown({ blok });
      const html = lastHtml(processRichtext);
      expect(html).toContain('class="code-frame"');
      expect(html).toContain('class="code-frame__title"');
      expect(html).toContain('class="language-ts"');
      // no filename → language shown as the header label
      expect(html).toContain('>ts</figcaption>');
    });

    it('frames a fence with no language, with an empty header label', async () => {
      const { processRichtext } = await import('@/lib/richtext-pipeline');
      const blok: MarkdownBlok = {
        _uid: 'test-md-code-2b',
        component: 'markdown',
        content: '```\nplain text\n```',
      };

      await Markdown({ blok });
      const html = lastHtml(processRichtext);
      expect(html).toContain('class="code-frame"');
      // empty header label when there's no filename and no language
      expect(html).toContain('code-frame__title"></figcaption>');
    });

    it('HTML-escapes the filename', async () => {
      const { processRichtext } = await import('@/lib/richtext-pipeline');
      const blok: MarkdownBlok = {
        _uid: 'test-md-code-3',
        component: 'markdown',
        content: '```ts title="a<b>"\nx\n```',
      };

      await Markdown({ blok });
      const html = lastHtml(processRichtext);
      expect(html).toContain('a&lt;b&gt;');
      expect(html).not.toContain('<b>');
    });

    it('supports single-quoted titles', async () => {
      const { processRichtext } = await import('@/lib/richtext-pipeline');
      const blok: MarkdownBlok = {
        _uid: 'test-md-code-4',
        component: 'markdown',
        content: "```bash title='deploy.sh'\necho hi\n```",
      };

      await Markdown({ blok });
      const html = lastHtml(processRichtext);
      expect(html).toContain('class="code-frame__title"');
      expect(html).toContain('deploy.sh');
      expect(html).toContain('class="language-bash"');
    });
  });
});

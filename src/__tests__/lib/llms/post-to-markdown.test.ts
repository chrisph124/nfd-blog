import { describe, it, expect } from 'vitest';
import {
  buildFrontMatter,
  extractPostContent,
  postToMarkdown,
} from '@/lib/llms/post-to-markdown';
import type { PostBlok, StoryblokStory } from '@/types/storyblok';
import type { RichtextNode } from '@/lib/llms/richtext-to-markdown';

type PostBody = NonNullable<PostBlok['body']>;

const richtextNode = (...content: RichtextNode[]): RichtextNode => ({ type: 'doc', content });

const createStory = (body: PostBody, overrides?: Partial<StoryblokStory<PostBlok>>): StoryblokStory<PostBlok> => ({
  id: 1,
  uuid: 'uuid',
  name: 'Story Name',
  slug: 'my-post',
  full_slug: 'posts/my-post',
  created_at: '2024-01-01T00:00:00.000Z',
  published_at: '2024-06-01T00:00:00.000Z',
  first_published_at: '2024-05-01T00:00:00.000Z',
  content: {
    _uid: 'post',
    component: 'post',
    title: 'My Post',
    excerpt: 'A short excerpt',
    body,
  },
  position: 0,
  tag_list: ['ai', 'seo'],
  is_startpage: false,
  parent_id: null,
  meta_data: null,
  group_id: 'g',
  release_id: null,
  lang: 'en',
  path: '/posts/my-post',
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
  ...overrides,
});

describe('buildFrontMatter', () => {
  it('emits the extended, quoted front-matter block', () => {
    const fm = buildFrontMatter(createStory([]), 'https://example.com');
    expect(fm).toContain('---');
    expect(fm).toContain('title: "My Post"');
    expect(fm).toContain('slug: "my-post"');
    expect(fm).toContain('publishedAt: "2024-05-01T00:00:00.000Z"');
    expect(fm).toContain('dateModified: "2024-06-01T00:00:00.000Z"');
    expect(fm).toContain('canonical: "https://example.com/my-post"');
    expect(fm).toContain('author: "Hieu (Chris) Pham"');
    expect(fm).toContain('tags: ["ai", "seo"]');
    expect(fm).toContain('excerpt: "A short excerpt"');
  });

  it('falls back to story.name and created_at', () => {
    const story = createStory([], {
      name: 'Fallback',
      first_published_at: null,
      tag_list: [],
      content: {
        _uid: 'post',
        component: 'post',
        title: undefined,
        excerpt: undefined,
        body: [],
      },
    });
    const fm = buildFrontMatter(story, 'https://example.com');
    expect(fm).toContain('title: "Fallback"');
    expect(fm).toContain('publishedAt: "2024-01-01T00:00:00.000Z"');
    expect(fm).toContain('tags: []');
    expect(fm).toContain('excerpt: ""');
  });

  it('neutralizes YAML injection in scalar fields (RT#3)', () => {
    const story = createStory([], {
      content: {
        _uid: 'post',
        component: 'post',
        title: 'Title: with "quote"',
        excerpt: 'line1\n---\nkey: injected',
        body: [],
      },
    });
    const fm = buildFrontMatter(story, 'https://example.com');
    expect(fm).toContain(String.raw`title: "Title: with \"quote\""`);
    expect(fm).toContain(String.raw`excerpt: "line1\n---\nkey: injected"`);
    // The injected `---` must not appear as a real line break in the block.
    expect(fm.split('\n').filter((l) => l === '---')).toHaveLength(2);
  });

  it('escapes a bare carriage return in a scalar', () => {
    const story = createStory([], {
      content: { _uid: 'post', component: 'post', title: 'a\rb', excerpt: '', body: [] },
    });
    const fm = buildFrontMatter(story, 'https://example.com');
    expect(fm).toContain(String.raw`title: "a\nb"`);
    expect(fm).not.toMatch(/\r/);
  });
});

describe('postToMarkdown', () => {
  it('serializes a mixed body preserving authored order', () => {
    const body: PostBody = [
      { _uid: 'r', component: 'richtext', content: richtextNode({ type: 'paragraph', content: [{ type: 'text', text: 'Intro prose.' }] }) as unknown as PostBody[number]['content'] } as PostBody[number],
      { _uid: 'm', component: 'markdown', content: '## Section\n\nSome **markdown**.' },
      {
        _uid: 'media',
        component: 'media',
        media_file: { id: 1, filename: 'https://img/x.png', alt: 'Diagram' },
      },
      {
        _uid: 'c',
        component: 'code_tabs',
        tabs: [
          { _uid: 't', component: 'code_tab', label: 'app.ts', language: 'ts', code: 'const x = 1;', filename: 'app.ts' },
        ],
      },
    ] as unknown as PostBody;

    const out = postToMarkdown(createStory(body), { siteUrl: 'https://example.com' });

    const introIdx = out.indexOf('Intro prose.');
    const mdIdx = out.indexOf('## Section');
    const imgIdx = out.indexOf('![Diagram](https://img/x.png)');
    const codeIdx = out.indexOf('```ts title="app.ts"');
    expect(introIdx).toBeGreaterThan(-1);
    expect(mdIdx).toBeGreaterThan(introIdx);
    expect(imgIdx).toBeGreaterThan(mdIdx);
    expect(codeIdx).toBeGreaterThan(imgIdx);
    // Front matter + H1 present; passthrough markdown kept verbatim.
    expect(out.startsWith('---\n')).toBe(true);
    expect(out).toContain('# My Post');
    expect(out).toContain('Some **markdown**.');
    expect(out.endsWith('\n')).toBe(true);
  });

  it('serializes a YouTube media blok as a titled link (RT#6)', () => {
    const body: PostBody = [
      {
        _uid: 'yt',
        component: 'media',
        media_file: {
          id: 2,
          filename: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Demo',
          is_external_url: true,
        },
      },
    ] as unknown as PostBody;
    const out = postToMarkdown(createStory(body), { siteUrl: 'https://example.com' });
    expect(out).toContain('[Video: Demo](https://www.youtube.com/watch?v=dQw4w9WgXcQ)');
  });

  it('skips (does not throw on) an unknown body component', () => {
    const body = [{ _uid: 'x', component: 'unknown_blok' }] as unknown as PostBody;
    const out = postToMarkdown(createStory(body), { siteUrl: 'https://example.com' });
    expect(out).toContain('# My Post');
    expect(out).not.toContain('unknown_blok');
  });
});

describe('extractPostContent', () => {
  it('returns prose plaintext (code excluded) and ordered code samples', () => {
    const body: PostBody = [
      {
        _uid: 'r',
        component: 'richtext',
        content: richtextNode(
          { type: 'paragraph', content: [{ type: 'text', text: 'Prose text.' }] },
          { type: 'code_block', attrs: { class: 'language-ts' }, content: [{ type: 'text', text: 'inline()' }] },
        ) as unknown as PostBody[number]['content'],
      } as PostBody[number],
      { _uid: 'm', component: 'markdown', content: 'More prose with `code` inline.\n\n```js\nignored\n```' },
      {
        _uid: 'c',
        component: 'code_tabs',
        tabs: [{ _uid: 't', component: 'code_tab', label: 'app.ts', language: 'ts', code: 'const y = 2;', filename: 'app.ts' }],
      },
    ] as unknown as PostBody;

    const { prose, codeSamples } = extractPostContent(body);

    expect(prose).toContain('Prose text.');
    expect(prose).toContain('More prose with code inline.');
    expect(prose).not.toContain('inline()');
    expect(prose).not.toContain('ignored');

    expect(codeSamples).toEqual([
      { name: '', language: 'ts', code: 'inline()' },
      { name: 'app.ts', language: 'ts', code: 'const y = 2;' },
    ]);
  });

  it('handles an empty/undefined body', () => {
    expect(extractPostContent(undefined)).toEqual({ prose: '', codeSamples: [] });
    expect(extractPostContent([])).toEqual({ prose: '', codeSamples: [] });
  });
});

describe('post-to-markdown — fallback branches (coverage)', () => {
  it('dateModified falls back to publishedAt and null tags render as []', () => {
    const story = createStory([], {
      published_at: null,
      tag_list: null as unknown as string[],
    });
    const fm = buildFrontMatter(story, 'https://example.com');
    expect(fm).toContain('dateModified: "2024-05-01T00:00:00.000Z"');
    expect(fm).toContain('tags: []');
  });

  it('serializes video files and media title/alt fallbacks; skips fileless/other media', () => {
    const body = [
      { _uid: 'v', component: 'media', media_file: { id: 1, filename: 'https://cdn/clip.mp4' } },
      { _uid: 'i', component: 'media', media_file: { id: 2, filename: 'https://cdn/pic.png', title: 'Shot' } },
      { _uid: 'n', component: 'media', media_file: { id: 3, filename: '' } },
      { _uid: 'o', component: 'media', media_file: { id: 4, filename: 'https://cdn/file.bin' } },
    ] as unknown as PostBody;
    const out = postToMarkdown(createStory(body), { siteUrl: 'https://example.com' });
    expect(out).toContain('[Video: Media](https://cdn/clip.mp4)');
    expect(out).toContain('![Shot](https://cdn/pic.png)');
    expect(out).not.toContain('file.bin');
  });

  it('falls back to story.name and tolerates a null body + content-less markdown blok', () => {
    const body = [{ _uid: 'm', component: 'markdown' }] as unknown as PostBody;
    const namedStory = createStory(body, {
      name: 'Just Name',
      content: { _uid: 'p', component: 'post', title: undefined, body } as unknown as PostBlok,
    });
    expect(postToMarkdown(namedStory, { siteUrl: 'https://example.com' })).toContain('# Just Name');

    const noBody = createStory([], {
      content: { _uid: 'p', component: 'post', title: 'T', body: undefined } as unknown as PostBlok,
    });
    expect(postToMarkdown(noBody, { siteUrl: 'https://example.com' })).toContain('# T');
  });

  it('extractPostContent skips media/unknown and empty-prose bloks', () => {
    const body = [
      {
        _uid: 'r',
        component: 'richtext',
        content: richtextNode({ type: 'code_block', attrs: {}, content: [{ type: 'text', text: 'x' }] }) as unknown as PostBody[number]['content'],
      } as PostBody[number],
      { _uid: 'm', component: 'markdown' },
      { _uid: 'media', component: 'media', media_file: { id: 1, filename: 'x.png' } },
      { _uid: 'u', component: 'unknown_blok' },
    ] as unknown as PostBody;

    const { prose, codeSamples } = extractPostContent(body);
    expect(prose).toBe('');
    expect(codeSamples).toEqual([{ name: '', language: '', code: 'x' }]);
  });
});

describe('post-to-markdown — alert blok (TL;DR)', () => {
  const alertBlok = (title: string | undefined, text?: string) =>
    ({
      _uid: 'a',
      component: 'alert',
      icon: 'information',
      color: 'emerald',
      title,
      body:
        text === undefined
          ? undefined
          : (richtextNode({ type: 'paragraph', content: [{ type: 'text', text }] }) as unknown as string),
    }) as unknown as PostBody[number];

  it('serializes an alert as its TL;DR prose led by the title', () => {
    const out = postToMarkdown(createStory([alertBlok('TL;DR', 'The whole point.')]), {
      siteUrl: 'https://example.com',
    });
    expect(out).toContain('**TL;DR:** The whole point.');
  });

  it('serializes an alert with no title as bare body prose', () => {
    const out = postToMarkdown(createStory([alertBlok(undefined, 'Just the gist.')]), {
      siteUrl: 'https://example.com',
    });
    expect(out).toContain('Just the gist.');
    expect(out).not.toContain('**:');
  });

  it('skips an alert with an empty body', () => {
    const out = postToMarkdown(createStory([alertBlok('TL;DR', undefined)]), {
      siteUrl: 'https://example.com',
    });
    expect(out).toContain('# My Post');
    expect(out).not.toContain('TL;DR');
  });

  it('extractPostContent counts alert TL;DR prose toward articleBody', () => {
    const { prose, codeSamples } = extractPostContent([alertBlok('TL;DR', 'Summary sentence.')]);
    expect(prose).toContain('Summary sentence.');
    expect(codeSamples).toEqual([]);
  });
});

describe('post-to-markdown — comparison blok', () => {
  const comparisonBlok = () =>
    ({
      _uid: 'cmp',
      component: 'comparison',
      title: 'Then vs Now',
      columns: [
        {
          _uid: 'c1',
          component: 'comparison_column',
          heading: 'Before',
          body: richtextNode({ type: 'paragraph', content: [{ type: 'text', text: 'Old way.' }] }) as unknown as string,
        },
        {
          _uid: 'c2',
          component: 'comparison_column',
          heading: 'After',
          body: richtextNode({ type: 'paragraph', content: [{ type: 'text', text: 'New way.' }] }) as unknown as string,
        },
      ],
    }) as unknown as PostBody[number];

  it('extractPostContent counts comparison title, headings, and card prose toward articleBody', () => {
    const { prose, codeSamples } = extractPostContent([comparisonBlok()]);
    expect(prose).toContain('Then vs Now');
    expect(prose).toContain('Before');
    expect(prose).toContain('Old way.');
    expect(prose).toContain('After');
    expect(prose).toContain('New way.');
    expect(codeSamples).toEqual([]);
  });

  it('serializes a comparison as sequential prose blocks led by the title', () => {
    const out = postToMarkdown(createStory([comparisonBlok()]), { siteUrl: 'https://example.com' });
    expect(out).toContain('**Then vs Now**');
    expect(out).toContain('**Before:** Old way.');
    expect(out).toContain('**After:** New way.');
  });
});

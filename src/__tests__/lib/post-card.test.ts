import { describe, it, expect } from 'vitest';
import { toPostCard } from '@/lib/post-card';
import type { PostBlok, StoryblokStory } from '@/types/storyblok';

const createStory = (
  overrides: Partial<StoryblokStory<PostBlok>> = {},
  content: Partial<PostBlok> = {}
): StoryblokStory<PostBlok> => ({
  id: 1,
  uuid: 'uuid-1',
  name: 'Story name',
  slug: 'my-post',
  full_slug: 'posts/my-post',
  created_at: '2025-01-01T00:00:00.000Z',
  published_at: '2025-08-05T07:04:35.000Z',
  first_published_at: '2025-01-15T00:00:00.000Z',
  content: {
    _uid: 'p',
    component: 'post',
    title: 'Post title',
    excerpt: 'Post excerpt',
    featured_image: { id: 1, filename: 'https://a.storyblok.com/f/hero.jpg', alt: 'Hero alt' },
    body: [],
    ...content,
  },
  position: 0,
  tag_list: [],
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

const richtextBody = [
  { _uid: 'r', component: 'richtext', content: [{ type: 'text', text: 'word '.repeat(250) }] },
] as unknown as PostBlok['body'];
const markdownBody = [
  { _uid: 'm', component: 'markdown', content: 'word '.repeat(450) },
] as unknown as PostBlok['body'];

describe('toPostCard', () => {
  it('maps a full story to the card fields only', () => {
    expect(toPostCard(createStory())).toEqual({
      uuid: 'uuid-1',
      href: '/my-post',
      title: 'Post title',
      excerpt: 'Post excerpt',
      image: { src: 'https://a.storyblok.com/f/hero.jpg', alt: 'Hero alt' },
      date: '2025-01-15T00:00:00.000Z',
      readingTime: '1 min read',
    });
  });

  it.each([
    ['root-level slug stays as is', createStory({ full_slug: 'my-post' }), { href: '/my-post' }],
    ['missing title falls back to the story name', createStory({}, { title: '  ' }), { title: 'Story name' }],
    [
      'image alt falls back to the title',
      createStory({}, { featured_image: { id: 1, filename: 'https://a.storyblok.com/f/hero.jpg', alt: '' } }),
      { image: { src: 'https://a.storyblok.com/f/hero.jpg', alt: 'Post title' } },
    ],
    ['never-published story dates by creation', createStory({ first_published_at: null }), { date: '2025-01-01T00:00:00.000Z' }],
    ['richtext body reading time', createStory({}, { body: richtextBody }), { readingTime: '2 min read' }],
    ['markdown body reading time', createStory({}, { body: markdownBody }), { readingTime: '3 min read' }],
  ])('%s', (_label, story, expected) => {
    expect(toPostCard(story)).toMatchObject(expected);
  });

  it('omits the image and excerpt when the story has none', () => {
    const card = toPostCard(createStory({}, { featured_image: { id: 1, filename: '' }, excerpt: '' }));

    expect(card).not.toHaveProperty('image');
    expect(card).not.toHaveProperty('excerpt');
  });
});

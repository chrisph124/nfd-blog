import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CardItem from '@/components/molecules/CardItem';
import type { CardItemBlok, StoryblokStory, PostBlok } from '@/types/storyblok';
import type { PostCardData } from '@/lib/post-card';

// Mock Card component
vi.mock('@/components/molecules/Card', () => ({
  default: ({ post }: { post: PostCardData }) => (
    <div data-testid="mock-card">{post.title}</div>
  ),
}));

// Mock storyblokEditable
vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: () => ({}),
}));

// Mock getStoryblokApi
const mockGet = vi.fn();
vi.mock('@/lib/storyblok', () => ({
  getStoryblokApi: () => ({
    get: mockGet,
  }),
  storyblokVersion: 'published',
}));

const createMockStory = (title = 'Test Post'): { data: { story: StoryblokStory<PostBlok> } } => ({
  data: {
    story: {
      id: 1,
      uuid: 'test-uuid',
      name: 'Test Post',
      slug: 'test-post',
      full_slug: 'posts/test-post',
      created_at: '2025-01-15T10:00:00.000Z',
      published_at: '2025-01-15T10:00:00.000Z',
      first_published_at: '2025-01-15T10:00:00.000Z',
      content: {
        _uid: 'content-uid',
        component: 'post',
        title,
        featured_image: {
          id: 1,
          filename: 'https://a.storyblok.com/f/test.jpg',
          alt: 'Test image',
        },
        excerpt: 'Test excerpt',
        body: [],
      },
      position: 0,
      tag_list: ['test'],
      is_startpage: false,
      parent_id: null,
      meta_data: null,
      group_id: 'group-1',
      release_id: null,
      lang: 'default',
      path: '/posts/test-post',
      alternates: [],
      default_full_slug: null,
      translated_slugs: null,
    },
  },
});

const createMockBlok = (post_reference?: string | number): CardItemBlok => ({
  _uid: 'test-uid',
  component: 'card_item',
  post_reference: post_reference as string | undefined,
});

const renderCardItem = async (post_reference?: string | number) =>
  render(await CardItem({ blok: createMockBlok(post_reference) }));

describe('CardItem', () => {
  beforeEach(() => {
    mockGet.mockReset();
    vi.unstubAllEnvs();
  });

  it('renders nothing and fetches nothing without a post reference', async () => {
    expect(await CardItem({ blok: createMockBlok() })).toBeNull();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('renders the referenced post as a card in the server HTML', async () => {
    mockGet.mockResolvedValue(createMockStory('Server rendered post'));

    await renderCardItem('posts/test-post');

    expect(screen.getByTestId('mock-card')).toHaveTextContent('Server rendered post');
  });

  it.each([
    ['a UUID', '550e8400-e29b-41d4-a716-446655440000', { version: 'published', find_by: 'uuid' }],
    ['a slug', 'posts/test-post', { version: 'published' }],
  ])('looks the post up by %s', async (_label, reference, params) => {
    mockGet.mockResolvedValue(createMockStory());

    await renderCardItem(reference);

    expect(mockGet).toHaveBeenCalledWith(`cdn/stories/${reference}`, params);
  });

  it('hides a broken reference in production and explains it in development', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGet.mockRejectedValue(new Error('Not found'));

    vi.stubEnv('NODE_ENV', 'production');
    expect(await CardItem({ blok: createMockBlok('missing') })).toBeNull();

    vi.stubEnv('NODE_ENV', 'development');
    await renderCardItem('missing');
    expect(screen.getByText('CardItem Error')).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

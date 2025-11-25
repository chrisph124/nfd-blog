import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CardList from '@/components/organisms/CardList';
import type { StoryblokStory, PostBlok } from '@/types/storyblok';

// Mock the Card component
vi.mock('@/components/molecules/Card', () => ({
  default: ({ story }: { story: StoryblokStory<PostBlok> }) => (
    <div data-testid={`card-${story.uuid}`}>
      {story.content.title}
    </div>
  ),
}));

// Mock getStoryblokApi
const mockGet = vi.fn();
vi.mock('@/lib/storyblok', () => ({
  getStoryblokApi: () => ({
    get: mockGet,
  }),
}));

const createMockStory = (
  id: number,
  overrides: Partial<StoryblokStory<PostBlok>> = {}
): StoryblokStory<PostBlok> => ({
  id,
  uuid: `uuid-${id}`,
  name: `Post ${id}`,
  slug: `post-${id}`,
  full_slug: `posts/post-${id}`,
  created_at: '2025-01-15T10:00:00.000Z',
  published_at: '2025-01-15T10:00:00.000Z',
  first_published_at: '2025-01-15T10:00:00.000Z',
  content: {
    _uid: `content-uid-${id}`,
    component: 'post',
    title: `Test Post ${id}`,
    featured_image: {
      id,
      filename: `https://a.storyblok.com/f/test-${id}.jpg`,
      alt: `Test image ${id}`,
    },
    excerpt: `Excerpt for post ${id}`,
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
  path: `/posts/post-${id}`,
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
  ...overrides,
});

describe('CardList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', async () => {
      mockGet.mockResolvedValue({
        data: {
          stories: [createMockStory(1), createMockStory(2)],
        },
      });

      render(await CardList({ startsWithPath: 'posts/' }));

      expect(screen.getByTestId('card-uuid-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-uuid-2')).toBeInTheDocument();
    });

    it('renders multiple post cards', async () => {
      mockGet.mockResolvedValue({
        data: {
          stories: [
            createMockStory(1),
            createMockStory(2),
            createMockStory(3),
          ],
        },
      });

      render(await CardList({ startsWithPath: 'posts/' }));

      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
      expect(screen.getByText('Test Post 3')).toBeInTheDocument();
    });

    it('renders empty state when no stories are found', async () => {
      mockGet.mockResolvedValue({
        data: {
          stories: [],
        },
      });

      render(await CardList({ startsWithPath: 'posts/' }));

      expect(screen.getByText('No posts found.')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('calls API with correct default parameters', async () => {
      mockGet.mockResolvedValue({
        data: {
          stories: [],
        },
      });

      render(await CardList({}));

      expect(mockGet).toHaveBeenCalledWith('cdn/stories', {
        starts_with: 'posts/',
        version: 'draft',
        content_type: 'post',
      });
    });

    it('calls API with custom starts_with path', async () => {
      mockGet.mockResolvedValue({
        data: {
          stories: [],
        },
      });

      render(await CardList({ startsWithPath: 'blog/' }));

      expect(mockGet).toHaveBeenCalledWith('cdn/stories', {
        starts_with: 'blog/',
        version: 'draft',
        content_type: 'post',
      });
    });

    it('calls API with tag filter when provided', async () => {
      mockGet.mockResolvedValue({
        data: {
          stories: [],
        },
      });

      render(await CardList({ filterByTag: 'pixel-playground' }));

      expect(mockGet).toHaveBeenCalledWith('cdn/stories', {
        starts_with: 'posts/',
        version: 'draft',
        content_type: 'post',
        with_tag: 'pixel-playground',
      });
    });

    it('calls API with both custom path and tag filter', async () => {
      mockGet.mockResolvedValue({
        data: {
          stories: [],
        },
      });

      render(await CardList({
        startsWithPath: 'articles/',
        filterByTag: 'featured'
      }));

      expect(mockGet).toHaveBeenCalledWith('cdn/stories', {
        starts_with: 'articles/',
        version: 'draft',
        content_type: 'post',
        with_tag: 'featured',
      });
    });
  });

  describe('Layout', () => {
    it('renders grid layout with correct classes', async () => {
      mockGet.mockResolvedValue({
        data: {
          stories: [createMockStory(1)],
        },
      });

      const { container } = render(await CardList({ startsWithPath: 'posts/' }));

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass(
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4',
        'gap-6'
      );
    });
  });

  describe('Props Handling', () => {
    it('handles undefined filterByTag', async () => {
      mockGet.mockResolvedValue({
        data: {
          stories: [createMockStory(1)],
        },
      });

      render(await CardList({ filterByTag: undefined }));

      expect(mockGet).toHaveBeenCalledWith('cdn/stories', {
        starts_with: 'posts/',
        version: 'draft',
        content_type: 'post',
      });
    });

    it('handles missing stories in API response', async () => {
      mockGet.mockResolvedValue({
        data: {},
      });

      render(await CardList({ startsWithPath: 'posts/' }));

      expect(screen.getByText('No posts found.')).toBeInTheDocument();
    });
  });

  describe('Card Rendering', () => {
    it('passes correct story prop to each Card', async () => {
      const stories = [createMockStory(1), createMockStory(2)];
      mockGet.mockResolvedValue({
        data: { stories },
      });

      render(await CardList({ startsWithPath: 'posts/' }));

      expect(screen.getByTestId('card-uuid-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-uuid-2')).toBeInTheDocument();
    });

    it('uses story uuid as key for each card', async () => {
      const stories = [
        createMockStory(1, { uuid: 'unique-id-1' }),
        createMockStory(2, { uuid: 'unique-id-2' }),
      ];
      mockGet.mockResolvedValue({
        data: { stories },
      });

      render(await CardList({ startsWithPath: 'posts/' }));

      expect(screen.getByTestId('card-unique-id-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-unique-id-2')).toBeInTheDocument();
    });
  });
});

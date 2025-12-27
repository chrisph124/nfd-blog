import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostList from '@/components/organisms/PostList';
import type { PostListBlok, StoryblokStory, PostBlok } from '@/types/storyblok';

// Mock PostListClient
vi.mock('@/components/organisms/PostListClient', () => ({
  default: ({ initialPosts, perPage, hasMore }: {
    initialPosts: StoryblokStory<PostBlok>[];
    perPage: number;
    hasMore: boolean;
  }) => (
    <div data-testid="post-list-client">
      <div data-testid="initial-posts-count">{initialPosts.length}</div>
      <div data-testid="per-page">{perPage}</div>
      <div data-testid="has-more">{hasMore.toString()}</div>
    </div>
  ),
}));

// Mock Storyblok API
const mockGet = vi.fn();
vi.mock('@/lib/storyblok', () => ({
  getStoryblokApi: () => ({ get: mockGet }),
}));

// Mock post data
const createMockPost = (id: number): StoryblokStory<PostBlok> => ({
  id,
  uuid: `uuid-${id}`,
  name: `Post ${id}`,
  slug: `post-${id}`,
  full_slug: `posts/post-${id}`,
  created_at: '2025-01-01T00:00:00.000Z',
  published_at: '2025-01-01T00:00:00.000Z',
  first_published_at: '2025-01-01T00:00:00.000Z',
  content: {
    _uid: `content-${id}`,
    component: 'post',
    title: `Post ${id} Title`,
    featured_image: {
      id: 1,
      filename: 'https://example.com/image.jpg',
      alt: 'Test image',
    },
  },
  position: 0,
  tag_list: ['test'],
  is_startpage: false,
  parent_id: null,
  meta_data: null,
  group_id: 'group-1',
  release_id: null,
  lang: 'en',
  path: '/posts/post-1',
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
});

describe('PostList Server Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering with default settings', () => {
    it('renders with default posts_per_page (12)', async () => {
      const mockPosts = Array.from({ length: 12 }, (_, i) => createMockPost(i + 1));

      mockGet.mockResolvedValue({
        data: { stories: mockPosts },
        headers: { total: '48' },
      });

      const blok: PostListBlok = {
        _uid: 'test-uid',
        component: 'post_list',
      };

      const component = await PostList({ blok });
      render(component);

      expect(screen.getByTestId('initial-posts-count')).toHaveTextContent('12');
      expect(screen.getByTestId('per-page')).toHaveTextContent('12');
      expect(screen.getByTestId('has-more')).toHaveTextContent('true');
    });

    it('fetches from Storyblok with correct parameters', async () => {
      mockGet.mockResolvedValue({
        data: { stories: [createMockPost(1)] },
        headers: { total: '1' },
      });

      const blok: PostListBlok = {
        _uid: 'test-uid',
        component: 'post_list',
      };

      await PostList({ blok });

      expect(mockGet).toHaveBeenCalledWith('cdn/stories', {
        version: 'draft',
        content_type: 'post',
        sort_by: 'first_published_at:desc',
        per_page: 12,
        page: 1,
      });
    });
  });

  describe('Custom posts_per_page', () => {
    it('renders with custom posts_per_page (24)', async () => {
      const mockPosts = Array.from({ length: 24 }, (_, i) => createMockPost(i + 1));

      mockGet.mockResolvedValue({
        data: { stories: mockPosts },
        headers: { total: '48' },
      });

      const blok: PostListBlok = {
        _uid: 'test-uid',
        component: 'post_list',
        posts_per_page: 24,
      };

      const component = await PostList({ blok });
      render(component);

      expect(screen.getByTestId('per-page')).toHaveTextContent('24');
      expect(mockGet).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({
        per_page: 24,
      }));
    });
  });

  describe('hasMore calculation', () => {
    it('sets hasMore=true when more posts exist', async () => {
      const mockPosts = Array.from({ length: 12 }, (_, i) => createMockPost(i + 1));

      mockGet.mockResolvedValue({
        data: { stories: mockPosts },
        headers: { total: '48' },
      });

      const blok: PostListBlok = {
        _uid: 'test-uid',
        component: 'post_list',
      };

      const component = await PostList({ blok });
      render(component);

      expect(screen.getByTestId('has-more')).toHaveTextContent('true');
    });

    it('sets hasMore=false when all posts loaded', async () => {
      const mockPosts = Array.from({ length: 12 }, (_, i) => createMockPost(i + 1));

      mockGet.mockResolvedValue({
        data: { stories: mockPosts },
        headers: { total: '12' },
      });

      const blok: PostListBlok = {
        _uid: 'test-uid',
        component: 'post_list',
      };

      const component = await PostList({ blok });
      render(component);

      expect(screen.getByTestId('has-more')).toHaveTextContent('false');
    });
  });

  describe('Error handling', () => {
    it('handles Storyblok API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockGet.mockRejectedValue(new Error('Storyblok API error'));

      const blok: PostListBlok = {
        _uid: 'test-uid',
        component: 'post_list',
      };

      const component = await PostList({ blok });
      render(component);

      expect(screen.getByText(/Unable to load posts/i)).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching posts:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('handles empty results', async () => {
      mockGet.mockResolvedValue({
        data: { stories: [] },
        headers: { total: '0' },
      });

      const blok: PostListBlok = {
        _uid: 'test-uid',
        component: 'post_list',
      };

      const component = await PostList({ blok });
      render(component);

      expect(screen.getByTestId('initial-posts-count')).toHaveTextContent('0');
      expect(screen.getByTestId('has-more')).toHaveTextContent('false');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostListClient from '@/components/organisms/PostListClient';
import type { StoryblokStory, PostBlok } from '@/types/storyblok';

// Mock Card component
vi.mock('@/components/molecules/Card', () => ({
  default: ({ story }: { story: StoryblokStory<PostBlok> }) => (
    <div data-testid={`card-${story.uuid}`}>{story.name}</div>
  ),
}));

// Mock motion/react-m for ScrollReveal
vi.mock('motion/react-m', () => {
  return new Proxy({}, {
    get: (_: unknown, prop: string) => {
      // eslint-disable-next-line react/display-name
      return React.forwardRef(
        (
          {
            children,
            className,
            ...htmlProps
          }: Record<string, unknown>,
          ref: unknown
        ) => {
          return React.createElement(
            prop,
            { ...htmlProps, className, ref },
            children as React.ReactNode
          );
        }
      );
    },
  });
});

// Mock fetch
global.fetch = vi.fn();

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
  },
  position: 0,
  tag_list: ['test'],
  is_startpage: false,
  parent_id: null,
  meta_data: null,
  group_id: 'group-1',
  release_id: null,
  lang: 'en',
  path: `/posts/post-${id}`,
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
});

describe('PostListClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial rendering', () => {
    it('renders initial posts grid', () => {
      const initialPosts = [createMockPost(1), createMockPost(2), createMockPost(3)];

      render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={12}
          hasMore={true}
        />
      );

      expect(screen.getByTestId('card-uuid-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-uuid-2')).toBeInTheDocument();
      expect(screen.getByTestId('card-uuid-3')).toBeInTheDocument();
    });

    it('shows Load More button when hasMore=true', () => {
      const initialPosts = [createMockPost(1)];

      render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={12}
          hasMore={true}
        />
      );

      expect(screen.getByRole('button', { name: /load more posts/i })).toBeInTheDocument();
    });

    it('hides Load More button when hasMore=false', () => {
      const initialPosts = [createMockPost(1)];

      render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={12}
          hasMore={false}
        />
      );

      expect(screen.queryByRole('button', { name: /load more posts/i })).not.toBeInTheDocument();
    });
  });

  describe('Load More functionality', () => {
    it('fetches next page when Load More clicked', async () => {
      const initialPosts = [createMockPost(1), createMockPost(2)];
      const nextPagePosts = [createMockPost(3), createMockPost(4)];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          stories: nextPagePosts,
          total: 10,
        }),
      });

      render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={2}
          hasMore={true}
        />
      );

      const loadMoreButton = screen.getByRole('button', { name: /load more posts/i });
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/posts?page=2&per_page=2');
      });

      await waitFor(() => {
        expect(screen.getByTestId('card-uuid-3')).toBeInTheDocument();
        expect(screen.getByTestId('card-uuid-4')).toBeInTheDocument();
      });
    });

    it('appends new posts to existing list', async () => {
      const initialPosts = [createMockPost(1)];
      const nextPagePosts = [createMockPost(2)];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          stories: nextPagePosts,
          total: 10,
        }),
      });

      render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={1}
          hasMore={true}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /load more posts/i }));

      await waitFor(() => {
        expect(screen.getByTestId('card-uuid-1')).toBeInTheDocument();
        expect(screen.getByTestId('card-uuid-2')).toBeInTheDocument();
      });
    });

    it('shows loading state during fetch', async () => {
      const initialPosts = [createMockPost(1)];

      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
        new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={12}
          hasMore={true}
        />
      );

      const loadMoreButton = screen.getByRole('button', { name: /load more posts/i });
      fireEvent.click(loadMoreButton);

      expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
      expect(loadMoreButton).toBeDisabled();
    });

    it('updates hasMore when all posts loaded', async () => {
      const initialPosts = [createMockPost(1)];
      const nextPagePosts = [createMockPost(2)];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          stories: nextPagePosts,
          total: 2,
        }),
      });

      render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={1}
          hasMore={true}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /load more posts/i }));

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /load more posts/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('handles API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const initialPosts = [createMockPost(1)];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={12}
          hasMore={true}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /load more posts/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch posts/i)).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('allows retry after error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const initialPosts = [createMockPost(1)];

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            stories: [createMockPost(2)],
            total: 10,
          }),
        });

      render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={12}
          hasMore={true}
        />
      );

      const loadMoreButton = screen.getByRole('button', { name: /load more posts/i });
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch posts/i)).toBeInTheDocument();
      });

      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(screen.queryByText(/failed to fetch posts/i)).not.toBeInTheDocument();
        expect(screen.getByTestId('card-uuid-2')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Layout', () => {
    it('renders container with correct wrapper classes', () => {
      const initialPosts = [createMockPost(1)];

      const { container } = render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={12}
          hasMore={true}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'flex-col', 'gap-6', 'max-w-[1280px]', 'px-4', 'md:px-8', 'lg:px-12', 'xl:px-5', 'mx-auto');
    });

    it('renders grid with responsive breakpoints', () => {
      const initialPosts = [createMockPost(1), createMockPost(2)];

      const { container } = render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={12}
          hasMore={true}
        />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', '2xl:grid-cols-4');
    });

    it('applies correct padding classes to container', () => {
      const initialPosts = [createMockPost(1)];

      const { container } = render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={12}
          hasMore={true}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('px-4', 'md:px-8', 'lg:px-12', 'xl:px-5');
    });
  });

  describe('Accessibility', () => {
    it('has aria-label on Load More button', () => {
      const initialPosts = [createMockPost(1)];

      render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={12}
          hasMore={true}
        />
      );

      const button = screen.getByRole('button', { name: /load more posts/i });
      expect(button).toHaveAttribute('aria-label', 'Load more posts');
    });

    it('has role="alert" on error message', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const initialPosts = [createMockPost(1)];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        statusText: 'Error',
      });

      render(
        <PostListClient
          initialPosts={initialPosts}
          perPage={12}
          hasMore={true}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /load more posts/i }));

      await waitFor(() => {
        const errorElement = screen.getByText(/failed to fetch posts/i);
        expect(errorElement).toHaveAttribute('role', 'alert');
      });

      consoleSpy.mockRestore();
    });
  });
});

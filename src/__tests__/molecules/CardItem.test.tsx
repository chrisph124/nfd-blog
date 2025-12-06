import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CardItem from '@/components/molecules/CardItem';
import type { CardItemBlok, StoryblokStory, PostBlok } from '@/types/storyblok';

// Mock Card component
vi.mock('@/components/molecules/Card', () => ({
  default: ({ story }: { story: StoryblokStory<PostBlok> }) => (
    <div data-testid="mock-card">{story.content.title}</div>
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
  post_reference,
});

// Test mock function type support and IntelliSense
// Note: IDE should provide full IntelliSense for mock functions

describe('CardItem', () => {
  beforeEach(() => {
    mockGet.mockClear();
  });

  describe('Rendering', () => {
    it('renders without crashing', async () => {
      const blok = createMockBlok('test-uuid');
      mockGet.mockResolvedValueOnce(createMockStory());

      render(<CardItem blok={blok} />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-card')).toBeInTheDocument();
      });
    });

    it('returns null when post_reference is not provided', () => {
      const blok = createMockBlok();
      const { container } = render(<CardItem blok={blok} />);

      expect(container.firstChild).toBeNull();
    });

    it('shows loading skeleton initially', () => {
      const blok = createMockBlok('test-uuid');
      mockGet.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { container } = render(<CardItem blok={blok} />);

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('fetches post by UUID with find_by parameter', async () => {
      const blok = createMockBlok('0ae4a708-0226-42f0-99d5-93ec86ba89e5');
      mockGet.mockResolvedValueOnce(createMockStory('Fetched Post'));

      render(<CardItem blok={blok} />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(
          'cdn/stories/0ae4a708-0226-42f0-99d5-93ec86ba89e5',
          { version: 'draft', find_by: 'uuid' }
        );
      });

      expect(screen.getByText('Fetched Post')).toBeInTheDocument();
    });

    it('fetches post by numeric ID', async () => {
      const blok = createMockBlok(12345);
      mockGet.mockResolvedValueOnce(createMockStory('Post by ID'));

      render(<CardItem blok={blok} />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(
          'cdn/stories/12345',
          { version: 'draft' }
        );
      });

      expect(screen.getByText('Post by ID')).toBeInTheDocument();
    });

    it('fetches post by slug', async () => {
      const blok = createMockBlok('my-post-slug');
      mockGet.mockResolvedValueOnce(createMockStory('Post by Slug'));

      render(<CardItem blok={blok} />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(
          'cdn/stories/my-post-slug',
          { version: 'draft' }
        );
      });

      expect(screen.getByText('Post by Slug')).toBeInTheDocument();
    });

    it('renders Card component with fetched story', async () => {
      const blok = createMockBlok('test-slug');
      mockGet.mockResolvedValueOnce(createMockStory('Successfully Fetched'));

      render(<CardItem blok={blok} />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-card')).toBeInTheDocument();
        expect(screen.getByText('Successfully Fetched')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message in development when fetch fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.stubEnv('NODE_ENV', 'development');

      const blok = createMockBlok('failing-uuid');
      mockGet.mockRejectedValueOnce(new Error('Not found'));

      render(<CardItem blok={blok} />);

      await waitFor(() => {
        expect(screen.getByText('CardItem Error')).toBeInTheDocument();
        expect(screen.getByText(/Failed to fetch post/)).toBeInTheDocument();
      });

      vi.unstubAllEnvs();
      consoleSpy.mockRestore();
    });

    it('returns null in production when fetch fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.stubEnv('NODE_ENV', 'production');

      const blok = createMockBlok('failing-uuid');
      mockGet.mockRejectedValueOnce(new Error('Not found'));

      const { container } = render(<CardItem blok={blok} />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });

      vi.unstubAllEnvs();
      consoleSpy.mockRestore();
    });

    it('logs error to console when fetch fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const blok = createMockBlok('error-test');
      mockGet.mockRejectedValueOnce(new Error('API Error'));

      render(<CardItem blok={blok} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('CardItem: Failed to fetch post'),
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('Loading States', () => {
    it('shows loading state before data is fetched', () => {
      const blok = createMockBlok('loading-test');
      mockGet.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { container } = render(<CardItem blok={blok} />);

      // Check for skeleton structure using container query
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('bg-white', 'rounded-xl');
    });

    it('transitions from loading to content state', async () => {
      const blok = createMockBlok('transition-test');
      mockGet.mockResolvedValueOnce(createMockStory('Loaded Content'));

      const { container } = render(<CardItem blok={blok} />);

      // Initially shows loading
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

      // Then shows content
      await waitFor(() => {
        expect(screen.getByText('Loaded Content')).toBeInTheDocument();
      });

      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('handles different UUID formats correctly', async () => {
      const validUUIDs = [
        '0ae4a708-0226-42f0-99d5-93ec86ba89e5',
        'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE',
        '12345678-1234-1234-1234-123456789012',
      ];

      for (const uuid of validUUIDs) {
        mockGet.mockClear();
        mockGet.mockResolvedValueOnce(createMockStory());

        const blok = createMockBlok(uuid);
        render(<CardItem blok={blok} />);

        await waitFor(() => {
          expect(mockGet).toHaveBeenCalledWith(
            `cdn/stories/${uuid}`,
            { version: 'draft', find_by: 'uuid' }
          );
        });
      }
    });

    it('does not add find_by for non-UUID strings', async () => {
      const blok = createMockBlok('simple-slug');
      mockGet.mockResolvedValueOnce(createMockStory());

      render(<CardItem blok={blok} />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(
          'cdn/stories/simple-slug',
          { version: 'draft' }
        );
      });
    });
  });
});

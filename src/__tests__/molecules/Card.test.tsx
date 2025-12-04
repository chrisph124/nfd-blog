import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '@/components/molecules/Card';
import type { StoryblokStory, PostBlok } from '@/types/storyblok';

const createMockStory = (overrides: Partial<StoryblokStory<PostBlok>> = {}): StoryblokStory<PostBlok> => ({
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
    title: 'Test Post Title',
    featured_image: {
      id: 1,
      filename: 'https://a.storyblok.com/f/test.jpg',
      alt: 'Test image',
    },
    excerpt: 'This is a test excerpt for the post.',
    body: [],
  },
  position: 0,
  tag_list: ['test', 'example'],
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
  ...overrides,
});

describe('Card', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const story = createMockStory();
      render(<Card story={story} />);

      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    });

    it('renders the post title', () => {
      const story = createMockStory({
        content: {
          _uid: 'content-uid',
          component: 'post',
          title: 'Custom Post Title',
          body: [],
        },
      });
      render(<Card story={story} />);

      expect(screen.getByText('Custom Post Title')).toBeInTheDocument();
    });

    it('renders the excerpt', () => {
      const story = createMockStory();
      render(<Card story={story} />);

      expect(screen.getByText('This is a test excerpt for the post.')).toBeInTheDocument();
    });

    it('renders the featured image when provided', () => {
      const story = createMockStory();
      render(<Card story={story} />);

      const image = screen.getByAltText('Test image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src');
    });

    it('does not render image when featured_image is not provided', () => {
      const story = createMockStory({
        content: {
          _uid: 'content-uid',
          component: 'post',
          title: 'Post without image',
          featured_image: undefined,
          body: [],
        },
      });
      render(<Card story={story} />);

      const images = screen.queryAllByRole('img');
      expect(images).toHaveLength(0);
    });
  });

  describe('Tags', () => {
    it('renders tags when provided', () => {
      const story = createMockStory();
      render(<Card story={story} />);

      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('example')).toBeInTheDocument();
    });

    it('does not render tags section when tag_list is empty', () => {
      const story = createMockStory({ tag_list: [] });
      const { container } = render(<Card story={story} />);

      const tagsContainer = container.querySelector('.flex.flex-wrap.gap-2');
      expect(tagsContainer).not.toBeInTheDocument();
    });
  });

  describe('Metadata', () => {
    it('renders formatted creation date', () => {
      const story = createMockStory({
        created_at: '2025-01-15T10:00:00.000Z',
      });
      render(<Card story={story} />);

      expect(screen.getByText(/January 15, 2025/)).toBeInTheDocument();
    });

    it('renders reading time based on excerpt', () => {
      const longExcerpt = 'word '.repeat(300);
      const story = createMockStory({
        content: {
          _uid: 'content-uid',
          component: 'post',
          title: 'Test Post',
          excerpt: longExcerpt,
          body: [],
        },
      });
      render(<Card story={story} />);

      expect(screen.getByText(/min read/)).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('renders multiple links (no nesting)', () => {
      const story = createMockStory();
      render(<Card story={story} />);

      const links = screen.getAllByRole('link');
      // Should have at least: image link, title link, and tag links
      expect(links.length).toBeGreaterThan(1);
    });

    it('renders title link with correct href', () => {
      const story = createMockStory();
      render(<Card story={story} />);

      const titleLink = screen.getByRole('link', { name: /Test Post Title/i });
      expect(titleLink).toHaveAttribute('href', '/test-post');
    });

    it('renders tag links with correct href', () => {
      const story = createMockStory();
      render(<Card story={story} />);

      const testTagLink = screen.getByRole('link', { name: 'test' });
      const exampleTagLink = screen.getByRole('link', { name: 'example' });

      expect(testTagLink).toHaveAttribute('href', '/insight-hub/test');
      expect(exampleTagLink).toHaveAttribute('href', '/insight-hub/example');
    });

    it('strips posts/ prefix from full_slug for root-level URL', () => {
      const story = createMockStory({ full_slug: 'posts/my-blog-post' });
      render(<Card story={story} />);

      const titleLink = screen.getByRole('link', { name: /Test Post Title/i });
      expect(titleLink).toHaveAttribute('href', '/my-blog-post');
    });
  });

  describe('Props Handling', () => {
    it('handles missing excerpt', () => {
      const story = createMockStory({
        content: {
          _uid: 'content-uid',
          component: 'post',
          title: 'Post without description text',
          excerpt: undefined,
          body: [],
        },
      });
      const { container } = render(<Card story={story} />);

      expect(screen.getByText('Post without description text')).toBeInTheDocument();

      const excerpt = container.querySelector('p.text-sm.text-gray-600');
      expect(excerpt).not.toBeInTheDocument();
    });

    it('handles missing title with fallback', () => {
      const story = createMockStory({
        content: {
          _uid: 'content-uid',
          component: 'post',
          title: undefined,
          body: [],
        },
      });
      const { container } = render(<Card story={story} />);

      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('');
    });
  });

  describe('Layout', () => {
    it('has correct card styling classes', () => {
      const story = createMockStory();
      const { container } = render(<Card story={story} />);

      const article = container.querySelector('article');
      expect(article).toHaveClass('group', 'relative', 'flex', 'flex-col', 'h-full', 'bg-white', 'rounded-xl');
    });

    it('applies hover effects', () => {
      const story = createMockStory();
      const { container } = render(<Card story={story} />);

      const article = container.querySelector('article');
      expect(article).toHaveClass('hover:shadow-md');
    });

    it('has max-width constraint', () => {
      const story = createMockStory();
      const { container } = render(<Card story={story} />);

      const article = container.querySelector('article');
      expect(article).toHaveClass('max-w-full', 'md:max-w-[320px]');
    });
  });
});

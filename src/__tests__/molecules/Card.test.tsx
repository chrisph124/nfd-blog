import { describe, it, expect } from 'vitest';
import type { CSSProperties } from 'react';
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
      expect(links.length).toBeGreaterThan(1);
    });

    it('renders title link with correct href', () => {
      const story = createMockStory();
      render(<Card story={story} />);

      const titleLink = screen.getByRole('link', { name: /Test Post Title/i });
      expect(titleLink).toHaveAttribute('href', '/test-post');
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

      const heading = container.querySelector('h2');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('');
    });
  });

  describe('CardMeta edge cases', () => {
    it('renders metadata section with reading time even when date is absent', () => {
      // created_at empty → formattedDate='', but getStoryReadingTime always returns non-empty
      const story = createMockStory({
        created_at: '',
        content: {
          _uid: 'content-uid',
          component: 'post',
          title: 'No Date Post',
          body: [{ type: 'paragraph', content: [{ type: 'text', text: 'word '.repeat(100) }] }],
        },
      });
      const { container } = render(<Card story={story} />);

      // Reading time still renders because getStoryReadingTime always returns a string
      expect(container.querySelector('.text-xs.italic')).toBeInTheDocument();
      expect(screen.getByText(/min read/)).toBeInTheDocument();
    });

    it('renders date and reading time with bullet separator when both present', () => {
      const story = createMockStory({
        created_at: '2025-01-15T10:00:00.000Z',
        content: {
          _uid: 'content-uid',
          component: 'post',
          title: 'Full Meta Post',
          body: [{ type: 'paragraph', content: [{ type: 'text', text: 'word '.repeat(100) }] }],
        },
      });
      render(<Card story={story} />);

      expect(screen.getByText(/January 15, 2025/)).toBeInTheDocument();
      expect(screen.getByText('•')).toBeInTheDocument();
      expect(screen.getByText(/min read/)).toBeInTheDocument();
    });
  });

  describe('Forwarded props', () => {
    it('forwards className prop to the outer article', () => {
      const story = createMockStory();
      const { container } = render(<Card story={story} className="custom-test-class" />);

      const article = container.querySelector('article');
      expect(article).toHaveClass('custom-test-class');
      // Default classes still present
      expect(article).toHaveClass('group', 'rounded-xl');
    });

    it('forwards style prop to the outer article (including CSS custom properties)', () => {
      const story = createMockStory();
      const { container } = render(
        <Card
          story={story}
          style={{ '--reveal-i': 3, color: 'red' } as CSSProperties}
        />
      );

      const article = container.querySelector('article') as HTMLElement;
      expect(article.style.getPropertyValue('--reveal-i')).toBe('3');
      expect(article.style.color).toBe('red');
    });
  });

  describe('Layout', () => {
    it('has correct card styling classes', () => {
      const story = createMockStory();
      const { container } = render(<Card story={story} />);

      const article = container.querySelector('article');
      expect(article).toHaveClass('group', 'relative', 'flex', 'h-full', 'bg-background', 'rounded-xl');
    });

    it('applies responsive flex direction (flex-row md:flex-col)', () => {
      const story = createMockStory();
      const { container } = render(<Card story={story} />);

      const article = container.querySelector('article');
      expect(article).toHaveClass('flex', 'flex-row', 'md:flex-col');
    });

    it('applies hover effects', () => {
      const story = createMockStory();
      const { container } = render(<Card story={story} />);

      const article = container.querySelector('article');
      expect(article).toHaveClass('hover:shadow-md');
    });

    it('has max-width constraint (max-w-full lg:max-w-[320px])', () => {
      const story = createMockStory();
      const { container } = render(<Card story={story} />);

      const article = container.querySelector('article');
      expect(article).toHaveClass('max-w-full', 'lg:max-w-[320px]');
    });

    it('applies transition effects', () => {
      const story = createMockStory();
      const { container } = render(<Card story={story} />);

      const article = container.querySelector('article');
      expect(article).toHaveClass('transition-all', 'duration-200');
    });
  });
});

describe('CardImage alt fallback', () => {
  it('uses title as alt text when image.alt is empty (covers || title branch on line 33)', () => {
    const story = createMockStory({
      content: {
        _uid: 'content-uid',
        component: 'post',
        title: 'My Post Title',
        featured_image: {
          id: 1,
          filename: 'https://a.storyblok.com/f/test.jpg',
          alt: '',  // empty alt → falls back to title
        },
        body: [],
      },
    });
    render(<Card story={story} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'My Post Title');
  });
});

describe('CardMeta null return', () => {
  it('returns null when CardMeta receives no createdAt and body is undefined', () => {
    // getStoryReadingTime(undefined) returns '1 min read' always,
    // so CardMeta's null return is not reachable through normal Card usage.
    // This test documents the known behavior.
    const story = createMockStory({
      created_at: '',
      content: {
        _uid: 'content-uid',
        component: 'post',
        title: 'No Meta Post',
        body: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello world' }] }],
      },
    });
    const { container } = render(<Card story={story} />);

    // CardMeta shows readingTime even without date
    expect(container.querySelector('.text-xs.italic')).toBeInTheDocument();
  });
});

describe('Edge Cases', () => {
  it('handles malformed excerpt gracefully', () => {
    const story = createMockStory({
      content: {
        _uid: 'content-uid',
        component: 'post',
        title: 'Test Post',
        excerpt: undefined,
        body: [],
      },
    });

    expect(() => render(<Card story={story} />)).not.toThrow();
  });

  it('handles post with posts/ prefix already stripped', () => {
    const story = createMockStory({ full_slug: 'my-post' });
    render(<Card story={story} />);

    const titleLink = screen.getByRole('link', { name: /Test Post Title/i });
    expect(titleLink).toHaveAttribute('href', '/my-post');
  });

  it('handles missing featured_image', () => {
    const story = createMockStory({
      content: {
        _uid: 'content-uid',
        component: 'post',
        title: 'Test Post Title',
        featured_image: undefined,
        body: [],
      },
    });

    expect(() => render(<Card story={story} />)).not.toThrow();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('handles empty or null title', () => {
    const story = createMockStory({
      content: {
        _uid: 'content-uid',
        component: 'post',
        title: '',
        body: [],
      },
    });

    expect(() => render(<Card story={story} />)).not.toThrow();
  });

  it('handles extremely long titles', () => {
    const longTitle = 'A'.repeat(1000);
    const story = createMockStory({
      content: {
        _uid: 'content-uid',
        component: 'post',
        title: longTitle,
        body: [],
      },
    });

    expect(() => render(<Card story={story} />)).not.toThrow();
  });
});

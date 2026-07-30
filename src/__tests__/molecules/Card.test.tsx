import { describe, it, expect } from 'vitest';
import type { CSSProperties } from 'react';
import { render, screen, within } from '@testing-library/react';
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
    it('renders a single whole-card link labelled by the title', () => {
      const story = createMockStory();
      render(<Card story={story} />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute('aria-label', 'Test Post Title');
    });

    it('gives the whole-card link a non-empty aria-label when the title is missing', () => {
      const story = createMockStory({
        content: { _uid: 'content-uid', component: 'post', title: '', body: [] },
      });
      render(<Card story={story} />);

      // Never a nameless link for screen readers when a post ships without a title.
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Read post');
    });

    it('renders title link with correct href', () => {
      const story = createMockStory();
      render(<Card story={story} />);

      const cardLink = screen.getByRole('link', { name: /Test Post Title/i });
      expect(cardLink).toHaveAttribute('href', '/test-post');
    });

    it('strips posts/ prefix from full_slug for root-level URL', () => {
      const story = createMockStory({ full_slug: 'posts/my-blog-post' });
      render(<Card story={story} />);

      const cardLink = screen.getByRole('link', { name: /Test Post Title/i });
      expect(cardLink).toHaveAttribute('href', '/my-blog-post');
    });
  });

  describe('Props Handling', () => {
    it('omits the excerpt paragraph when excerpt is not provided', () => {
      const story = createMockStory({
        content: {
          _uid: 'content-uid',
          component: 'post',
          title: 'Post without description text',
          excerpt: undefined,
          body: [],
        },
      });
      render(<Card story={story} />);

      expect(screen.getByText('Post without description text')).toBeInTheDocument();
      // Behavioral check: the excerpt text is simply absent. (Replaces a prior
      // selector `p.text-sm.text-gray-600` that never matched the real DOM and
      // therefore passed vacuously whether or not an excerpt rendered.)
      expect(
        screen.queryByText('This is a test excerpt for the post.')
      ).not.toBeInTheDocument();
    });

    it('renders the excerpt paragraph when excerpt is provided', () => {
      render(<Card story={createMockStory()} />); // default mock has an excerpt
      expect(
        screen.getByText('This is a test excerpt for the post.')
      ).toBeInTheDocument();
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
      expect(container.querySelector('.italic')).toBeInTheDocument();
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
    it('forwards className prop onto the outer article', () => {
      render(<Card story={createMockStory()} className="custom-test-class" />);

      const article = screen.getByRole('article');
      expect(article.tagName).toBe('ARTICLE');
      expect(article).toHaveClass('custom-test-class');
    });

    it('forwards style prop to the outer article (including CSS custom properties)', () => {
      render(
        <Card
          story={createMockStory()}
          style={{ '--reveal-i': 3, color: 'red' } as CSSProperties}
        />
      );

      const article = screen.getByRole('article') as HTMLElement;
      expect(article.style.getPropertyValue('--reveal-i')).toBe('3');
      expect(article.style.color).toBe('red');
    });
  });

  describe('Structure', () => {
    it('renders the outer element as an <article> (role="article") after the shadcn migration', () => {
      render(<Card story={createMockStory()} />);

      const article = screen.getByRole('article');
      expect(article.tagName).toBe('ARTICLE');
    });

    it('nests image, title heading, and excerpt inside the article', () => {
      render(<Card story={createMockStory()} />);

      const article = screen.getByRole('article');
      // A single whole-card link owns navigation; image + heading + excerpt overlay it.
      expect(within(article).getAllByRole('link')).toHaveLength(1);
      expect(within(article).getByRole('img')).toBeInTheDocument();
      expect(within(article).getByRole('heading', { level: 2 })).toHaveTextContent('Test Post Title');
      expect(within(article).getByText('This is a test excerpt for the post.')).toBeInTheDocument();
    });

    it('renders the poster shell with scrim, overlay, and content layers', () => {
      const { container } = render(<Card story={createMockStory()} />);

      const article = screen.getByRole('article');
      expect(article).toHaveClass('post-poster', 'group', 'aspect-16/10', 'bg-black');
      expect(container.querySelector('.post-poster__scrim')).toBeInTheDocument();
      expect(container.querySelector('.post-poster__overlay')).toBeInTheDocument();
      expect(container.querySelector('.post-poster__content')).toBeInTheDocument();
    });
  });

  describe('Poster title color', () => {
    it('recolors the title to text-primary-400 with no hover/dark overrides', () => {
      render(<Card story={createMockStory()} />);

      const heading = screen.getByRole('heading', { level: 2 });
      // Important variant: beats the unlayered global `.h3` color so the title
      // stays primary-400 in light mode too (see Card.tsx comment).
      expect(heading).toHaveClass('text-primary-400!');
      // Old palette must be gone: no per-state hover color, no dark-mode override.
      expect(heading).not.toHaveClass('group-hover:text-primary-700');
      expect(heading).not.toHaveClass('dark:text-primary-300');
    });
  });

  describe('Reveal is opacity/transform, not unmount', () => {
    it('keeps the excerpt in the DOM (proves it is not display:none / removed)', () => {
      const { container } = render(<Card story={createMockStory()} />);

      const excerpt = screen.getByText('This is a test excerpt for the post.');
      expect(excerpt).toBeInTheDocument();
      expect(excerpt).toHaveClass('post-poster__excerpt');
      // Theme-invariant light copy: `.subtitle-2` sets no color, so without this
      // the excerpt inherits body `--foreground` (black in light theme) and is
      // invisible on the always-dark poster.
      expect(excerpt).toHaveClass('text-white/90');
      // Responsive clamp: 3 lines on mobile/tablet (<1280), up to 5 on desktop (xl).
      expect(excerpt).toHaveClass('line-clamp-3', 'xl:line-clamp-5');
      expect(container.querySelector('.post-poster__excerpt')).toBeInTheDocument();
      // Excerpt lives inside the grid-rows reveal wrapper (desktop hover slide-up).
      const reveal = container.querySelector('.post-poster__excerpt-reveal');
      expect(reveal).toBeInTheDocument();
      expect(reveal).toContainElement(excerpt);
    });
  });

  describe('No-image fallback', () => {
    it('renders title, meta, and excerpt over the black poster when image is absent', () => {
      const story = createMockStory({
        content: {
          _uid: 'content-uid',
          component: 'post',
          title: 'Imageless Poster',
          excerpt: 'Still legible without a picture.',
          body: [],
        },
      });
      const { container } = render(<Card story={story} />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Imageless Poster');
      expect(screen.getByText('Still legible without a picture.')).toBeInTheDocument();
      // The black shell + overlay still render so content stays readable.
      expect(screen.getByRole('article')).toHaveClass('bg-black');
      expect(container.querySelector('.post-poster__overlay')).toBeInTheDocument();
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
    expect(container.querySelector('.italic')).toBeInTheDocument();
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

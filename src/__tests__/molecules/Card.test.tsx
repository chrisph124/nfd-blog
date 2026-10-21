import { describe, it, expect } from 'vitest';
import type { CSSProperties } from 'react';
import { render, screen, within } from '@testing-library/react';
import Card from '@/components/molecules/Card';
import type { PostCardData } from '@/lib/post-card';

const createMockPost = (overrides: Partial<PostCardData> = {}): PostCardData => ({
  uuid: 'test-uuid',
  href: '/test-post',
  title: 'Test Post Title',
  excerpt: 'This is a test excerpt for the post.',
  image: { src: 'https://a.storyblok.com/f/test.jpg', alt: 'Test image' },
  date: '2025-01-15T10:00:00.000Z',
  readingTime: '4 min read',
  ...overrides,
});

describe('Card', () => {
  describe('Rendering', () => {
    it('renders the post title and excerpt', () => {
      render(<Card post={createMockPost()} />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Post Title');
      expect(screen.getByText('This is a test excerpt for the post.')).toBeInTheDocument();
    });

    it('renders the image with its alt text', () => {
      render(<Card post={createMockPost()} />);

      const image = screen.getByAltText('Test image');
      expect(image).toHaveAttribute('src');
    });

    it('omits the excerpt paragraph when the post has none', () => {
      render(<Card post={createMockPost({ excerpt: undefined })} />);

      expect(screen.queryByText('This is a test excerpt for the post.')).not.toBeInTheDocument();
    });
  });

  describe('Metadata', () => {
    it('renders the formatted date and reading time with a bullet separator', () => {
      render(<Card post={createMockPost()} />);

      expect(screen.getByText('January 15, 2025')).toBeInTheDocument();
      expect(screen.getByText('•')).toBeInTheDocument();
      expect(screen.getByText('4 min read')).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('renders a single whole-card link labelled by the title', () => {
      render(<Card post={createMockPost()} />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute('aria-label', 'Test Post Title');
      expect(links[0]).toHaveAttribute('href', '/test-post');
    });

    it('gives the whole-card link a non-empty aria-label when the title is missing', () => {
      render(<Card post={createMockPost({ title: '' })} />);

      // Never a nameless link for screen readers when a post ships without a title.
      expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'Read post');
    });
  });

  describe('Forwarded props', () => {
    it('forwards className prop onto the outer article', () => {
      render(<Card post={createMockPost()} className="custom-test-class" />);

      const article = screen.getByRole('article');
      expect(article.tagName).toBe('ARTICLE');
      expect(article).toHaveClass('custom-test-class');
    });

    it('forwards style prop to the outer article (including CSS custom properties)', () => {
      render(
        <Card
          post={createMockPost()}
          style={{ '--reveal-i': 3, color: 'red' } as CSSProperties}
        />
      );

      const article = screen.getByRole('article') as HTMLElement;
      expect(article.style.getPropertyValue('--reveal-i')).toBe('3');
      expect(article.style.color).toBe('red');
    });
  });

  describe('Structure', () => {
    it('nests image, title heading, and excerpt inside the article', () => {
      render(<Card post={createMockPost()} />);

      const article = screen.getByRole('article');
      // A single whole-card link owns navigation; image + heading + excerpt overlay it.
      expect(within(article).getAllByRole('link')).toHaveLength(1);
      expect(within(article).getByRole('img')).toBeInTheDocument();
      expect(within(article).getByRole('heading', { level: 2 })).toHaveTextContent('Test Post Title');
      expect(within(article).getByText('This is a test excerpt for the post.')).toBeInTheDocument();
    });

    it('renders the poster shell with scrim, overlay, and content layers', () => {
      const { container } = render(<Card post={createMockPost()} />);

      const article = screen.getByRole('article');
      expect(article).toHaveClass('post-poster', 'group', 'aspect-16/10', 'bg-black');
      expect(container.querySelector('.post-poster__scrim')).toBeInTheDocument();
      expect(container.querySelector('.post-poster__overlay')).toBeInTheDocument();
      expect(container.querySelector('.post-poster__content')).toBeInTheDocument();
    });
  });

  describe('Poster title color', () => {
    it('recolors the title to text-primary-400 with no hover/dark overrides', () => {
      render(<Card post={createMockPost()} />);

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
      const { container } = render(<Card post={createMockPost()} />);

      const excerpt = screen.getByText('This is a test excerpt for the post.');
      expect(excerpt).toHaveClass('post-poster__excerpt');
      // Theme-invariant light copy: `.subtitle-2` sets no color, so without this
      // the excerpt inherits body `--foreground` (black in light theme) and is
      // invisible on the always-dark poster.
      expect(excerpt).toHaveClass('text-white/90');
      // Responsive clamp: 3 lines on mobile/tablet (<1280), up to 5 on desktop (xl).
      expect(excerpt).toHaveClass('line-clamp-3', 'xl:line-clamp-5');
      // Excerpt lives inside the grid-rows reveal wrapper (desktop hover slide-up).
      const reveal = container.querySelector('.post-poster__excerpt-reveal');
      expect(reveal).toContainElement(excerpt);
    });
  });

  describe('No-image fallback', () => {
    it('renders title, meta, and excerpt over the black poster when image is absent', () => {
      const { container } = render(
        <Card post={createMockPost({ image: undefined, title: 'Imageless Poster', excerpt: 'Still legible without a picture.' })} />
      );

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Imageless Poster');
      expect(screen.getByText('Still legible without a picture.')).toBeInTheDocument();
      expect(screen.getByText('4 min read')).toBeInTheDocument();
      // The black shell + overlay still render so content stays readable.
      expect(screen.getByRole('article')).toHaveClass('bg-black');
      expect(container.querySelector('.post-poster__overlay')).toBeInTheDocument();
    });
  });
});

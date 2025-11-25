import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Post from '@/components/templates/Post';
import type { PostBlok } from '@/types/storyblok';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock StoryblokServerComponent
vi.mock('@storyblok/react/rsc', () => ({
  StoryblokServerComponent: ({ blok }: { blok: { _uid: string } }) => (
    <div data-testid={`blok-${blok._uid}`}>Mocked Blok</div>
  ),
}));

const createMockBlok = (overrides: Partial<PostBlok> = {}): PostBlok => ({
  _uid: 'test-uid',
  component: 'post',
  title: 'Test Post Title',
  featured_image: {
    id: 1,
    filename: 'https://a.storyblok.com/f/test.jpg',
    alt: 'Test featured image',
  },
  excerpt: 'This is a test excerpt for the post.',
  body: [],
  ...overrides,
});

describe('Post', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      render(<Post blok={blok} />);

      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    });

    it('renders the post title', () => {
      const blok = createMockBlok({ title: 'Custom Post Title' });
      render(<Post blok={blok} />);

      expect(screen.getByText('Custom Post Title')).toBeInTheDocument();
    });

    it('renders the excerpt', () => {
      const blok = createMockBlok();
      render(<Post blok={blok} />);

      expect(screen.getByText('This is a test excerpt for the post.')).toBeInTheDocument();
    });

    it('renders the featured image when provided', () => {
      const blok = createMockBlok();
      render(<Post blok={blok} />);

      const image = screen.getByAltText('Test featured image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://a.storyblok.com/f/test.jpg');
    });

    it('does not render image when featured_image is not provided', () => {
      const blok = createMockBlok({ featured_image: undefined });
      render(<Post blok={blok} />);

      const images = screen.queryAllByRole('img');
      expect(images).toHaveLength(0);
    });
  });

  describe('Body Content', () => {
    it('renders body blocks when provided', () => {
      const blok = createMockBlok({
        body: [
          { _uid: 'block-1', component: 'paragraph' },
          { _uid: 'block-2', component: 'paragraph' },
        ],
      });
      render(<Post blok={blok} />);

      expect(screen.getByTestId('blok-block-1')).toBeInTheDocument();
      expect(screen.getByTestId('blok-block-2')).toBeInTheDocument();
    });

    it('does not render body section when body is empty', () => {
      const blok = createMockBlok({ body: [] });
      const { container } = render(<Post blok={blok} />);

      const proseDiv = container.querySelector('.prose');
      expect(proseDiv).not.toBeInTheDocument();
    });

    it('does not render body section when body is undefined', () => {
      const blok = createMockBlok({ body: undefined });
      const { container } = render(<Post blok={blok} />);

      const proseDiv = container.querySelector('.prose');
      expect(proseDiv).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('handles missing excerpt', () => {
      const blok = createMockBlok({ excerpt: undefined });
      render(<Post blok={blok} />);

      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      const excerptText = screen.queryByText(/excerpt/);
      expect(excerptText).not.toBeInTheDocument();
    });

    it('handles missing title', () => {
      const blok = createMockBlok({ title: undefined });
      const { container } = render(<Post blok={blok} />);

      const heading = container.querySelector('h1');
      expect(heading).not.toBeInTheDocument();
    });

    it('handles empty title', () => {
      const blok = createMockBlok({ title: '' });
      const { container } = render(<Post blok={blok} />);

      const heading = container.querySelector('h1');
      expect(heading).not.toBeInTheDocument();
    });

    it('uses title as alt text fallback when featured_image alt is missing', () => {
      const blok = createMockBlok({
        title: 'Fallback Alt Text',
        featured_image: {
          id: 1,
          filename: 'https://a.storyblok.com/f/test.jpg',
        },
      });
      render(<Post blok={blok} />);

      const image = screen.getByAltText('Fallback Alt Text');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('has correct article container styling', () => {
      const blok = createMockBlok();
      const { container } = render(<Post blok={blok} />);

      const article = container.querySelector('article');
      expect(article).toHaveClass('max-w-4xl', 'mx-auto', 'px-4', 'py-8');
    });

    it('applies prose styling to body content', () => {
      const blok = createMockBlok({
        body: [{ _uid: 'block-1', component: 'paragraph' }],
      });
      const { container } = render(<Post blok={blok} />);

      const proseDiv = container.querySelector('.prose');
      expect(proseDiv).toHaveClass('prose', 'prose-lg', 'max-w-none');
    });

    it('has correct header styling', () => {
      const blok = createMockBlok();
      const { container } = render(<Post blok={blok} />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('mb-8');
    });

    it('has correct featured image aspect ratio', () => {
      const blok = createMockBlok();
      const { container } = render(<Post blok={blok} />);

      const imageContainer = container.querySelector('.aspect-video');
      expect(imageContainer).toBeInTheDocument();
      expect(imageContainer).toHaveClass('w-full', 'overflow-hidden', 'rounded-xl', 'mb-8');
    });
  });
});

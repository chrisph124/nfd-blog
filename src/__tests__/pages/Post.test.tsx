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

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
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

  describe('Tags', () => {
    it('renders tags when provided', () => {
      const blok = createMockBlok();
      const tags = ['AI', 'Technology', 'Innovation'];
      render(<Post blok={blok} tags={tags} />);

      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Innovation')).toBeInTheDocument();
    });

    it('does not render tags section when tags array is empty', () => {
      const blok = createMockBlok();
      const { container } = render(<Post blok={blok} tags={[]} />);

      const tagsContainer = container.querySelector('.flex.flex-wrap.gap-2');
      expect(tagsContainer).not.toBeInTheDocument();
    });

    it('does not render tags section when tags prop is not provided', () => {
      const blok = createMockBlok();
      const { container } = render(<Post blok={blok} />);

      const tagsContainer = container.querySelector('.flex.flex-wrap.gap-2');
      expect(tagsContainer).not.toBeInTheDocument();
    });

    it('renders tag links with correct href', () => {
      const blok = createMockBlok();
      const tags = ['AI', 'Tech'];
      render(<Post blok={blok} tags={tags} />);

      const aiLink = screen.getByRole('link', { name: 'AI' });
      const techLink = screen.getByRole('link', { name: 'Tech' });

      expect(aiLink).toHaveAttribute('href', '/insight-hub/AI');
      expect(techLink).toHaveAttribute('href', '/insight-hub/Tech');
    });

    it('renders tags above title', () => {
      const blok = createMockBlok({ title: 'My Post Title' });
      const tags = ['First Tag'];
      const { container } = render(<Post blok={blok} tags={tags} />);

      const heroSection = container.querySelector('.flex.flex-col.items-center.gap-4');
      expect(heroSection).toBeInTheDocument();

      // Tags should come before title in DOM
      const elements = Array.from(heroSection?.children || []);
      const tagContainer = elements.find(el => el.classList.contains('flex-wrap'));
      const titleElement = elements.find(el => el.tagName === 'H1');

      expect(tagContainer).toBeTruthy();
      expect(titleElement).toBeTruthy();
      expect(elements.indexOf(tagContainer!)).toBeLessThan(elements.indexOf(titleElement!));
    });

    it('applies correct styling to tag links', () => {
      const blok = createMockBlok();
      const tags = ['Styled Tag'];
      render(<Post blok={blok} tags={tags} />);

      const tagLink = screen.getByRole('link', { name: 'Styled Tag' });
      // Check individual classes
      expect(tagLink).toHaveClass('px-3');
      expect(tagLink).toHaveClass('py-1');
      expect(tagLink).toHaveClass('text-sm');
      expect(tagLink).toHaveClass('rounded-full');
      // Check className string contains expected patterns
      expect(tagLink.className).toMatch(/text-white|backdrop-blur/);
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
      expect(article).toHaveClass('flex', 'flex-col', 'justify-center', 'items-center');
    });

    it('applies prose styling to body content', () => {
      const blok = createMockBlok({
        body: [{ _uid: 'block-1', component: 'paragraph' }],
      });
      const { container } = render(<Post blok={blok} />);

      const proseDiv = container.querySelector('.prose');
      expect(proseDiv).toHaveClass('prose', 'prose-lg', 'max-w-4xl');
    });

    it('has hero section with correct minimum height', () => {
      const blok = createMockBlok();
      const { container } = render(<Post blok={blok} />);

      const heroSection = container.querySelector('.relative.flex.items-center.justify-center');
      expect(heroSection).toBeInTheDocument();
      expect(heroSection).toHaveClass('min-h-[200px]', 'md:min-h-[300px]');
    });

    it('has dark overlay on hero image', () => {
      const blok = createMockBlok();
      const { container } = render(<Post blok={blok} />);

      const overlay = container.querySelector('.bg-black\\/60');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('absolute', 'inset-0', '-z-10');
    });

    it('has correct content max-width', () => {
      const blok = createMockBlok({
        body: [{ _uid: 'block-1', component: 'paragraph' }],
      });
      const { container } = render(<Post blok={blok} />);

      const contentSection = container.querySelector('.max-w-\\[1240px\\]');
      expect(contentSection).toBeInTheDocument();
    });
  });
});

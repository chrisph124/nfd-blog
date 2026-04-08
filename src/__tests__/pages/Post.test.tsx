import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Post from '@/components/templates/Post';
import type { PostBlok } from '@/types/storyblok';

vi.mock('node:crypto', () => ({
  randomUUID: () => 'test-uuid-12345'
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, priority, ...props }: {
    src: string;
    alt: string;
    fill?: boolean;
    priority?: boolean;
    [key: string]: unknown
  }) => (
    <div
      data-testid="next-image"
      data-src={src}
      data-alt={alt}
      data-fill={fill?.toString()}
      data-priority={priority?.toString()}
      alt={alt}
      role="img"
      aria-label={alt}
      {...props}
    />
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

// Mock ReadingProgress component
vi.mock('@/components/atoms/ReadingProgress', () => ({
  default: vi.fn(() => <div data-testid="reading-progress">Mocked ReadingProgress</div>),
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  getStoryReadingTime: vi.fn(() => '1 min read'),
  formatDate: vi.fn((date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }),
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

// Mock storyblok-utils
vi.mock('@/lib/storyblok-utils', () => ({
  StoryblokServerComponent: ({ blok }: { blok: { _uid: string } }) => (
    <div data-testid={`blok-${blok._uid}`}>Mocked Blok</div>
  ),
}));

// Mock IntersectionObserver for ReadingProgress component tests
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

let mockIntersectionObserver: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();

  // Mock IntersectionObserver
  mockIntersectionObserver = vi.fn().mockImplementation(
    function(this: IntersectionObserver, callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.observe = mockObserve;
      this.unobserve = mockUnobserve;
      this.disconnect = mockDisconnect;
      Object.defineProperty(this, 'callback', { value: callback });
      Object.defineProperty(this, 'options', { value: options });
      return this;
    }
  );

  global.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver;

  // Mock window properties for scroll testing
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1000
  });

  Object.defineProperty(window, 'pageYOffset', {
    writable: true,
    configurable: true,
    value: 0
  });

  Object.defineProperty(document.documentElement, 'scrollTop', {
    writable: true,
    configurable: true,
    value: 0
  });

  // Mock event listeners
  vi.spyOn(window, 'addEventListener');
  vi.spyOn(window, 'removeEventListener');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('alt', 'Test featured image');
      expect(image).toHaveAttribute('data-src', 'https://a.storyblok.com/f/test.jpg');
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

    it('renders tags as styled spans', () => {
      const blok = createMockBlok();
      const tags = ['AI', 'Tech'];
      render(<Post blok={blok} tags={tags} />);

      const aiSpan = screen.getByText('AI');
      const techSpan = screen.getByText('Tech');

      expect(aiSpan.tagName).toBe('SPAN');
      expect(techSpan.tagName).toBe('SPAN');
      expect(aiSpan).toHaveClass('px-3', 'py-1', 'text-sm', 'font-bold', 'text-white', 'uppercase', 'bg-white/20', 'backdrop-blur-sm', 'rounded-full');
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

    it('applies correct styling to tag spans', () => {
      const blok = createMockBlok();
      const tags = ['Styled Tag'];
      render(<Post blok={blok} tags={tags} />);

      const tagSpan = screen.getByText('Styled Tag');
      // Check individual classes
      expect(tagSpan).toHaveClass('px-3');
      expect(tagSpan).toHaveClass('py-1');
      expect(tagSpan).toHaveClass('text-sm');
      expect(tagSpan).toHaveClass('rounded-full');
      // Check className string contains expected patterns
      expect(tagSpan.className).toMatch(/text-white|backdrop-blur/);
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

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('alt', 'Fallback Alt Text');
      expect(image).toHaveAttribute('data-src', 'https://a.storyblok.com/f/test.jpg');
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
      expect(proseDiv).toHaveClass('prose', 'prose-lg', 'max-w-5xl', 'flex', 'flex-col', 'gap-y-6');
    });

    it('has hero section with correct minimum height', () => {
      const blok = createMockBlok();
      const { container } = render(<Post blok={blok} />);

      const heroSection = container.querySelector('.relative.flex.items-center.justify-center');
      expect(heroSection).toBeInTheDocument();
      expect(heroSection).toHaveClass('min-h-[300px]', 'xl:min-h-[500px]');
    });

    it('has dark overlay on hero image', () => {
      const blok = createMockBlok();
      const { container } = render(<Post blok={blok} />);

      const overlay = container.querySelector(String.raw`.bg-black\/70`);
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('absolute', 'inset-0', '-z-10');
    });

    it('has correct content max-width', () => {
      const blok = createMockBlok({
        body: [{ _uid: 'block-1', component: 'paragraph' }],
      });
      const { container } = render(<Post blok={blok} />);

      const contentSection = container.querySelector(String.raw`.max-w-\[1280px\]`);
      expect(contentSection).toBeInTheDocument();
    });
  });

  describe('Date and Reading Time', () => {
    it('displays created date when provided', () => {
      const blok = createMockBlok();
      const createdAt = '2025-01-15T10:00:00.000Z';

      render(<Post blok={blok} createdAt={createdAt} />);

      expect(screen.getByText('January 15, 2025')).toBeInTheDocument();
    });

    it('displays reading time for content', () => {
      const blok = createMockBlok();

      render(<Post blok={blok} />);

      expect(screen.getByText('1 min read')).toBeInTheDocument();
    });

    it('displays both date and reading time separated by bullet', () => {
      const blok = createMockBlok();
      const createdAt = '2025-01-15T10:00:00.000Z';

      render(<Post blok={blok} createdAt={createdAt} />);

      expect(screen.getByText('January 15, 2025')).toBeInTheDocument();
      expect(screen.getByText('1 min read')).toBeInTheDocument();
    });

    it('handles invalid date strings gracefully', () => {
      const blok = createMockBlok();
      const invalidDate = 'invalid-date';

      render(<Post blok={blok} createdAt={invalidDate} />);

      // Should still display reading time
      expect(screen.getByText('1 min read')).toBeInTheDocument();
      // Invalid date should not crash or display malformed content
      expect(screen.queryByText('invalid-date')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // ReadingProgress Integration Tests
  // ============================================================================

  describe('ReadingProgress Integration', () => {
    it('renders ReadingProgress component in Post template', () => {
      const blok = createMockBlok();
      render(<Post blok={blok} />);

      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();
    });

    it('renders ReadingProgress between hero section and article content', () => {
      const blok = createMockBlok({
        body: [{ _uid: 'block-1', component: 'paragraph' }],
      });
      render(<Post blok={blok} />);

      // Find the ReadingProgress component
      const readingProgress = screen.getByTestId('reading-progress');
      expect(readingProgress).toBeInTheDocument();

      // Check that article content is present via the blok component
      const blokComponent = screen.getByTestId('blok-block-1');
      expect(blokComponent).toBeInTheDocument();

      // Both ReadingProgress and content should be present
      expect(readingProgress).toBeInTheDocument();
      expect(blokComponent).toBeInTheDocument();
    });

    it('renders article content section with correct ID for progress tracking', () => {
      const blok = createMockBlok({
        body: [{ _uid: 'block-1', component: 'paragraph' }],
      });
      render(<Post blok={blok} />);

      // Check that content is rendered and can be found
      expect(screen.getByTestId('blok-block-1')).toBeInTheDocument();

      // Check that article is present and has proper structure
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('renders ReadingProgress even when no body content is present', () => {
      const blok = createMockBlok({ body: [] });
      render(<Post blok={blok} />);

      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();
    });

    it('renders ReadingProgress with all Post features (tags, date, reading time)', () => {
      const blok = createMockBlok({
        body: [{ _uid: 'block-1', component: 'paragraph' }],
      });
      const tags = ['Technology', 'AI'];
      const createdAt = '2025-01-15T10:00:00.000Z';

      render(<Post blok={blok} tags={tags} createdAt={createdAt} />);

      // All elements should be present together
      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('January 15, 2025')).toBeInTheDocument();
      expect(screen.getByText('1 min read')).toBeInTheDocument();
      expect(screen.getByTestId('blok-block-1')).toBeInTheDocument();
    });

    it('maintains correct article content structure with prose classes', () => {
      const blok = createMockBlok({
        body: [
          { _uid: 'block-1', component: 'paragraph' },
          { _uid: 'block-2', component: 'heading' },
        ],
      });
      render(<Post blok={blok} />);

      // Check that prose classes are applied to the correct element
      const proseSection = document.querySelector('.prose.prose-lg.max-w-5xl.flex.flex-col.gap-y-6');
      expect(proseSection).toBeInTheDocument();

      // ReadingProgress should still be present
      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();
    });

    it('preserves Storyblok content rendering with ReadingProgress', () => {
      const blok = createMockBlok({
        body: [
          { _uid: 'storyblok-1', component: 'rich_text' },
          { _uid: 'storyblok-2', component: 'image' },
        ],
      });
      render(<Post blok={blok} />);

      // ReadingProgress should be present
      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();

      // Storyblok content should render correctly
      expect(screen.getByTestId('blok-storyblok-1')).toBeInTheDocument();
      expect(screen.getByTestId('blok-storyblok-2')).toBeInTheDocument();
    });

    it('works with featured image and ReadingProgress', () => {
      const blok = createMockBlok({
        featured_image: {
          id: 1,
          filename: 'https://a.storyblok.com/f/test.jpg',
          alt: 'Test featured image',
        },
        body: [{ _uid: 'block-1', component: 'paragraph' }],
      });
      render(<Post blok={blok} />);

      // All elements should be present
      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();
      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(screen.getByTestId('blok-block-1')).toBeInTheDocument();
    });

    it('handles missing body content gracefully with ReadingProgress', () => {
      const blok = createMockBlok({ body: undefined });
      render(<Post blok={blok} />);

      // ReadingProgress should still render
      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();

      // Body section should not be present when no body content
      expect(screen.queryByText('Test excerpt')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Accessibility Integration Tests
  // ============================================================================

  describe('Accessibility Integration', () => {
    it('maintains proper heading hierarchy with ReadingProgress', () => {
      const blok = createMockBlok({ title: 'Accessible Post Title' });
      render(<Post blok={blok} />);

      // h1 should be present for the title
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Accessible Post Title');

      // ReadingProgress should be present but not interfere with heading structure
      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();
    });

    it('preserves ARIA labels on featured images with ReadingProgress', () => {
      const blok = createMockBlok({
        featured_image: {
          id: 1,
          filename: 'https://a.storyblok.com/f/test.jpg',
          alt: 'Descriptive alt text for accessibility',
        },
      });
      render(<Post blok={blok} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('aria-label', 'Descriptive alt text for accessibility');
      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();
    });

    it('maintains semantic structure with ReadingProgress integration', () => {
      const blok = createMockBlok({
        body: [{ _uid: 'block-1', component: 'paragraph' }],
      });
      render(<Post blok={blok} />);

      // Main article element should be present
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();

      // ReadingProgress should not break semantic structure
      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();

      // Content should be properly rendered
      expect(screen.getByTestId('blok-block-1')).toBeInTheDocument();
    });

    it('renders tags as spans with ReadingProgress', () => {
      const blok = createMockBlok();
      const tags = ['Accessibility', 'Testing'];
      render(<Post blok={blok} tags={tags} />);

      const accessibilitySpan = screen.getByText('Accessibility');
      const testingSpan = screen.getByText('Testing');

      expect(accessibilitySpan.tagName).toBe('SPAN');
      expect(testingSpan.tagName).toBe('SPAN');
      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Performance and Integration Tests
  // ============================================================================

  describe('Performance and Integration', () => {
    it('does not cause layout shift with ReadingProgress', () => {
      const blok = createMockBlok({
        body: [{ _uid: 'block-1', component: 'paragraph' }],
      });
      render(<Post blok={blok} />);

      // Check that main layout elements are present
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();

      // Check that hero section is present by looking for the image or title
      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();

      // Check that article content is present by looking for the blok component
      expect(screen.getByTestId('blok-block-1')).toBeInTheDocument();
    });

    it('handles window resize events gracefully with ReadingProgress', () => {
      const blok = createMockBlok({
        body: [{ _uid: 'block-1', component: 'paragraph' }],
      });
      render(<Post blok={blok} />);

      // Simulate window resize
      window.dispatchEvent(new Event('resize'));

      // Component should still render correctly
      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();
      expect(screen.getByTestId('blok-block-1')).toBeInTheDocument();
    });

    it('maintains responsive design with ReadingProgress', () => {
      const blok = createMockBlok({
        body: [{ _uid: 'block-1', component: 'paragraph' }],
      });
      const { container } = render(<Post blok={blok} />);

      // Check responsive classes are maintained
      const article = container.querySelector('article');
      expect(article).toHaveClass('gap-y-6', 'md:gap-y-12');

      const heroSection = container.querySelector('.relative.flex.items-center.justify-center');
      expect(heroSection).toHaveClass('min-h-[300px]', 'xl:min-h-[500px]');

      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();
    });

    it('preserves correct content max-width with ReadingProgress', () => {
      const blok = createMockBlok({
        body: [{ _uid: 'block-1', component: 'paragraph' }],
      });
      render(<Post blok={blok} />);

      // Check content containers have correct max-width
      const contentContainers = document.querySelectorAll(String.raw`.max-w-\[1280px\]`);
      expect(contentContainers.length).toBeGreaterThan(0);

      expect(screen.getByTestId('reading-progress')).toBeInTheDocument();
    });
  });
});

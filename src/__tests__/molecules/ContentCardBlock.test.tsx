/* eslint-disable @next/next/no-img-element */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContentCardBlock from '@/components/molecules/ContentCardBlock';
import type { ContentCardBlockBlok, StoryblokAsset, CtaBlok } from '@/types/storyblok';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill,
    className,
    sizes,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    sizes?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      data-fill={fill}
      data-class-name={className}
      data-sizes={sizes}
    />
  ),
}));

// Mock embla-carousel-react
vi.mock('embla-carousel-react', () => ({
  default: () => [
    { current: null },
    {
      scrollPrev: vi.fn(),
      scrollNext: vi.fn(),
    },
  ],
}));

// Mock embla-carousel-autoplay
vi.mock('embla-carousel-autoplay', () => ({
  default: vi.fn(() => ({
    stop: vi.fn(),
    play: vi.fn(),
  })),
}));

// Mock react-icons/hi2
vi.mock('react-icons/hi2', () => ({
  HiChevronLeft: () => <span data-testid="chevron-left">Left</span>,
  HiChevronRight: () => <span data-testid="chevron-right">Right</span>,
}));

// Mock @/lib/storyblok-utils
vi.mock('@/lib/storyblok-utils', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    renderRichText: vi.fn(() => '<p>Rendered rich text content</p>'),
    StoryblokServerComponent: ({ blok }: { blok: { _uid: string; component: string } }) => (
      <div data-testid={`cta-${blok._uid}`} data-component={blok.component}>CTA Component</div>
    ),
    makeStoryblokEditable: vi.fn(() => ({})),
  };
});

const createMockImage = (overrides: Partial<StoryblokAsset> = {}): StoryblokAsset => ({
  id: 1,
  filename: 'https://example.com/image.jpg',
  alt: 'Test image',
  title: 'Test Image',
  ...overrides,
});

const createMockCta = (uid: string, overrides: Partial<CtaBlok> = {}): CtaBlok => ({
  _uid: uid,
  component: 'cta',
  label: 'Click me',
  navigate_to: { cached_url: '/test', linktype: 'story' },
  cta_type: 'primary',
  cta_size: 'hug',
  ...overrides,
});

const createMockBlok = (overrides: Partial<ContentCardBlockBlok> = {}): ContentCardBlockBlok => ({
  _uid: 'test-uid',
  component: 'content_card_block',
  variant: 'primary',
  ...overrides,
});

describe('ContentCardBlock', () => {
  describe('Variant Styling', () => {
    it('applies primary gradient classes for primary variant', () => {
      const blok = createMockBlok({ variant: 'primary' });
      const { container } = render(<ContentCardBlock blok={blok} />);

      const article = container.querySelector('article');
      expect(article?.className).toContain('bg-[linear-gradient(135deg,var(--content-card-primary-from),var(--content-card-primary-to))]');
    });

    it('applies secondary gradient classes for secondary variant', () => {
      const blok = createMockBlok({ variant: 'secondary' });
      const { container } = render(<ContentCardBlock blok={blok} />);

      const article = container.querySelector('article');
      expect(article?.className).toContain('bg-[linear-gradient(135deg,var(--content-card-secondary-from),var(--content-card-secondary-to))]');
    });

    it('defaults to primary variant when variant is undefined', () => {
      const blok = createMockBlok({ variant: undefined });
      const { container } = render(<ContentCardBlock blok={blok} />);

      const article = container.querySelector('article');
      expect(article?.className).toContain('bg-[linear-gradient(135deg,var(--content-card-primary-from),var(--content-card-primary-to))]');
    });
  });

  describe('Title Rendering', () => {
    it('renders title as h3 when provided', () => {
      const blok = createMockBlok({ title: 'Test Title' });
      render(<ContentCardBlock blok={blok} />);

      const h3 = screen.getByRole('heading', { level: 3 });
      expect(h3).toHaveTextContent('Test Title');
    });

    it('does not render h3 when title is undefined', () => {
      const blok = createMockBlok({ title: undefined });
      const { container } = render(<ContentCardBlock blok={blok} />);

      expect(container.querySelector('h3')).not.toBeInTheDocument();
    });

    it('applies correct text color to title in light mode', () => {
      const blok = createMockBlok({ title: 'Test Title' });
      const { container } = render(<ContentCardBlock blok={blok} />);

      const h3 = container.querySelector('h3');
      expect(h3).toHaveClass('text-gray-900');
    });
  });

  describe('Subtitle Rendering', () => {
    it('renders subtitle as h5 when provided', () => {
      const blok = createMockBlok({ subtitle: 'Test Subtitle' });
      render(<ContentCardBlock blok={blok} />);

      const h5 = screen.getByRole('heading', { level: 5 });
      expect(h5).toHaveTextContent('Test Subtitle');
    });

    it('does not render h5 when subtitle is undefined', () => {
      const blok = createMockBlok({ subtitle: undefined });
      const { container } = render(<ContentCardBlock blok={blok} />);

      expect(container.querySelector('h5')).not.toBeInTheDocument();
    });

    it('applies correct font weight to subtitle', () => {
      const blok = createMockBlok({ subtitle: 'Test Subtitle' });
      const { container } = render(<ContentCardBlock blok={blok} />);

      const h5 = container.querySelector('h5');
      expect(h5).toHaveClass('font-normal');
    });
  });

  describe('Description Rendering', () => {
    it('does not render description div when description is undefined', () => {
      const blok = createMockBlok({ description: undefined });
      const { container } = render(<ContentCardBlock blok={blok} />);

      expect(container.querySelector('.prose')).not.toBeInTheDocument();
    });

    it('does not render description div when description is null', () => {
      const blok = createMockBlok({ description: null });
      const { container } = render(<ContentCardBlock blok={blok} />);

      expect(container.querySelector('.prose')).not.toBeInTheDocument();
    });

    it('does not render description div when description is a string', () => {
      const blok = createMockBlok({ description: 'plain string' as unknown as ContentCardBlockBlok['description'] });
      const { container } = render(<ContentCardBlock blok={blok} />);

      expect(container.querySelector('.prose')).not.toBeInTheDocument();
    });
  });

  describe('CTA Group Rendering', () => {
    it('renders CTA div when cta_group is provided and not empty', () => {
      const blok = createMockBlok({
        cta_group: [createMockCta('cta-1')],
      });
      const { container } = render(<ContentCardBlock blok={blok} />);

      // CTA div has flex, flex-wrap, gap-3, items-center classes
      const ctaDiv = container.querySelector('[class*="flex"][class*="flex-wrap"][class*="gap-3"][class*="items-center"]');
      expect(ctaDiv).toBeInTheDocument();
    });

    it('does not render CTA div when cta_group is undefined', () => {
      const blok = createMockBlok({ cta_group: undefined });
      const { container } = render(<ContentCardBlock blok={blok} />);

      const ctaDiv = container.querySelector('[class*="flex"][class*="flex-wrap"][class*="gap-3"]');
      expect(ctaDiv).not.toBeInTheDocument();
    });

    it('does not render CTA div when cta_group is empty array', () => {
      const blok = createMockBlok({ cta_group: [] });
      const { container } = render(<ContentCardBlock blok={blok} />);

      const ctaDiv = container.querySelector('[class*="flex"][class*="flex-wrap"][class*="gap-3"]');
      expect(ctaDiv).not.toBeInTheDocument();
    });
  });

  describe('Image Carousel Rendering', () => {
    it('renders ImageCarousel when images array is provided and not empty', () => {
      const blok = createMockBlok({
        images: [createMockImage()],
      });
      const { container } = render(<ContentCardBlock blok={blok} />);

      // ImageCarousel has mt-auto class
      expect(container.querySelector('.mt-auto')).toBeInTheDocument();
    });

    it('does not render ImageCarousel when images is undefined', () => {
      const blok = createMockBlok({ images: undefined });
      const { container } = render(<ContentCardBlock blok={blok} />);

      expect(container.querySelector('.mt-auto')).not.toBeInTheDocument();
    });

    it('does not render ImageCarousel when images is empty array', () => {
      const blok = createMockBlok({ images: [] });
      const { container } = render(<ContentCardBlock blok={blok} />);

      expect(container.querySelector('.mt-auto')).not.toBeInTheDocument();
    });

    it('passes hide_image_mobile prop to ImageCarousel', () => {
      const blok = createMockBlok({
        images: [createMockImage()],
        hide_image_mobile: true,
      });
      const { container } = render(<ContentCardBlock blok={blok} />);

      // When hideOnMobile is true, ImageCarousel container should have hidden md:block
      const hiddenDiv = container.querySelector('.hidden.md\\:block');
      expect(hiddenDiv).toBeInTheDocument();
    });
  });

  describe('Shadow Styling', () => {
    it('applies shadow-md class', () => {
      const blok = createMockBlok();
      const { container } = render(<ContentCardBlock blok={blok} />);

      const article = container.querySelector('article');
      expect(article).toHaveClass('shadow-md');
    });

    it('applies dark mode shadow class', () => {
      const blok = createMockBlok();
      const { container } = render(<ContentCardBlock blok={blok} />);

      const article = container.querySelector('article');
      expect(article?.className).toContain('dark:shadow-[0_4px_12px_rgba(255,255,255,0.08)]');
    });
  });

  describe('Container Structure', () => {
    it('renders as article element', () => {
      const blok = createMockBlok();
      const { container } = render(<ContentCardBlock blok={blok} />);

      expect(container.querySelector('article')).toBeInTheDocument();
    });

    it('applies flex and full height classes', () => {
      const blok = createMockBlok();
      const { container } = render(<ContentCardBlock blok={blok} />);

      const article = container.querySelector('article');
      expect(article).toHaveClass('flex', 'h-full', 'flex-col');
    });

    it('applies rounded-2xl padding and gap classes', () => {
      const blok = createMockBlok();
      const { container } = render(<ContentCardBlock blok={blok} />);

      const article = container.querySelector('article');
      expect(article).toHaveClass('rounded-2xl', 'p-6', 'gap-4');
    });
  });

  describe('Editable Integration', () => {
    it('applies storyblok editable props via makeStoryblokEditable', async () => {
      const { makeStoryblokEditable } = await import('@/lib/storyblok-utils');
      const blok = createMockBlok();
      render(<ContentCardBlock blok={blok} />);

      expect(makeStoryblokEditable).toHaveBeenCalledWith(blok);
    });
  });
});

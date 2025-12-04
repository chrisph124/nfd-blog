import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Hero from '@/components/organisms/Hero';
import type { HeroBlockBlok, StoryblokBlok } from '@/types/storyblok';

vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: vi.fn(() => ({ 'data-testid': 'storyblok-editable' })),
  StoryblokServerComponent: ({ blok }: { blok: StoryblokBlok }) => (
    <div data-testid={`cta-${blok._uid}`}>{blok.component}</div>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, fill, priority, ...props }: { src: string; alt: string; fill?: boolean; priority?: boolean; [key: string]: unknown }) => (
    <div
      data-src={src}
      data-alt={alt}
      role="img"
      aria-label={alt}
      {...(fill && { 'data-fill': 'true' })}
      {...(priority && { 'data-priority': 'true' })}
      data-testid="next-image"
      {...props}
    />
  ),
}));

const createMockBlok = (overrides: Partial<HeroBlockBlok> = {}): HeroBlockBlok => ({
  _uid: 'test-uid',
  component: 'hero_block',
  heading: 'Test Heading',
  heading_tag: 'h1',
  content_alignment: 'left',
  position: 'vertical',
  ...overrides,
});

describe('Hero', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      render(<Hero blok={blok} />);

      expect(screen.getByText('Test Heading')).toBeInTheDocument();
    });

    it('renders heading with correct tag', () => {
      const blok = createMockBlok({ heading: 'H1 Heading', heading_tag: 'h1' });
      render(<Hero blok={blok} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('H1 Heading');
    });

    it('renders with different heading tags', () => {
      const blok = createMockBlok({ heading: 'H2 Heading', heading_tag: 'h2' });
      render(<Hero blok={blok} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('H2 Heading');
    });

    it('renders as section element', () => {
      const blok = createMockBlok();
      const { container } = render(<Hero blok={blok} />);

      expect(container.querySelector('section')).toBeInTheDocument();
    });
  });

  describe('Content Elements', () => {
    it('renders eyebrow when provided', () => {
      const blok = createMockBlok({ eyebrow: 'Test Eyebrow' });
      render(<Hero blok={blok} />);

      expect(screen.getByText('Test Eyebrow')).toBeInTheDocument();
    });

    it('does not render eyebrow when not provided', () => {
      const blok = createMockBlok({ eyebrow: undefined });
      render(<Hero blok={blok} />);

      expect(screen.queryByText('Test Eyebrow')).not.toBeInTheDocument();
    });

    it('renders sub heading when provided', () => {
      const blok = createMockBlok({ sub_heading: 'Test Sub Heading' });
      render(<Hero blok={blok} />);

      expect(screen.getByText('Test Sub Heading')).toBeInTheDocument();
    });

    it('renders CTA group', () => {
      const blok = createMockBlok({
        cta_group: [
          { _uid: 'cta-1', component: 'cta', label: 'CTA 1' },
          { _uid: 'cta-2', component: 'cta', label: 'CTA 2' },
        ],
      });
      const { getByTestId } = render(<Hero blok={blok} />);

      expect(getByTestId('cta-cta-1')).toBeInTheDocument();
      expect(getByTestId('cta-cta-2')).toBeInTheDocument();
    });
  });

  describe('Background Image', () => {
    it('renders background image when provided', () => {
      const blok = createMockBlok({
        background_image: {
          id: 1,
          filename: '/bg-image.jpg',
          alt: 'Background',
        },
      });
      const { getAllByTestId } = render(<Hero blok={blok} />);

      const images = getAllByTestId('next-image');
      expect(images.length).toBeGreaterThan(0);
    });

    it('does not render background when not provided', () => {
      const blok = createMockBlok({ background_image: undefined });
      const { container } = render(<Hero blok={blok} />);

      const absoluteDiv = container.querySelector('.absolute.inset-0.z-0');
      expect(absoluteDiv).not.toBeInTheDocument();
    });
  });

  describe('Hero Image', () => {
    it('renders hero image when provided', () => {
      const blok = createMockBlok({
        image: {
          id: 2,
          filename: '/hero-image.jpg',
          alt: 'Hero Image',
        },
      });
      render(<Hero blok={blok} />);

      const figure = screen.getByRole('figure');
      expect(figure).toBeInTheDocument();
    });

    it('does not render figure when no image', () => {
      const blok = createMockBlok({ image: undefined });
      render(<Hero blok={blok} />);

      expect(screen.queryByRole('figure')).not.toBeInTheDocument();
    });
  });

  describe('Content Alignment', () => {
    it('applies left alignment classes', () => {
      const blok = createMockBlok({ content_alignment: 'left' });
      const { container } = render(<Hero blok={blok} />);

      const content = container.querySelector('[aria-label="Hero section content"]');
      expect(content).toHaveClass('items-start', 'text-left');
    });

    it('applies center alignment classes', () => {
      const blok = createMockBlok({ content_alignment: 'center' });
      const { container } = render(<Hero blok={blok} />);

      const content = container.querySelector('[aria-label="Hero section content"]');
      expect(content).toHaveClass('items-center', 'text-center');
    });

    it('applies right alignment classes', () => {
      const blok = createMockBlok({ content_alignment: 'right' });
      const { container } = render(<Hero blok={blok} />);

      const content = container.querySelector('[aria-label="Hero section content"]');
      expect(content).toHaveClass('items-end', 'text-right');
    });

    it('defaults to left alignment when content_alignment is undefined', () => {
      const blok: HeroBlockBlok = {
        _uid: 'test-uid',
        component: 'hero_block',
        heading: 'Test Heading',
        heading_tag: 'h1',
        content_alignment: undefined,
        position: 'vertical',
      };
      const { container } = render(<Hero blok={blok} />);

      const content = container.querySelector('[aria-label="Hero section content"]');
      expect(content).toHaveClass('items-start', 'text-left');
    });

    it('applies left alignment to CTA section when content_alignment is undefined', () => {
      const blok: HeroBlockBlok = {
        _uid: 'test-uid',
        component: 'hero_block',
        heading: 'Test Heading',
        heading_tag: 'h1',
        content_alignment: undefined,
        position: 'vertical',
        cta_group: [{ _uid: 'cta-1', component: 'cta', label: 'CTA' }],
      };
      const { container } = render(<Hero blok={blok} />);

      const ctaSection = container.querySelector('[aria-label="Hero CTA actions"]');
      expect(ctaSection).toHaveClass('justify-start');
    });
  });

  describe('Position Variants', () => {
    it('renders vertical position', () => {
      const blok = createMockBlok({ position: 'vertical' });
      const { container } = render(<Hero blok={blok} />);

      expect(container.querySelector('.flex-col')).toBeInTheDocument();
    });

    it('renders horizontal position', () => {
      const blok = createMockBlok({ position: 'horizontal' });
      const { container } = render(<Hero blok={blok} />);

      expect(container.querySelector('.lg\\:flex-row-reverse')).toBeInTheDocument();
    });

    it('renders horizontal-reverse position', () => {
      const blok = createMockBlok({ position: 'horizontal-reverse' });
      const { container } = render(<Hero blok={blok} />);

      expect(container.querySelector('.lg\\:flex-row')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-label on content section', () => {
      const blok = createMockBlok();
      const { container } = render(<Hero blok={blok} />);

      const content = container.querySelector('[aria-label="Hero section content"]');
      expect(content).toBeInTheDocument();
    });

    it('has aria-label on CTA section', () => {
      const blok = createMockBlok({
        cta_group: [{ _uid: 'cta-1', component: 'cta', label: 'CTA' }],
      });
      const { container } = render(<Hero blok={blok} />);

      const ctaSection = container.querySelector('[aria-label="Hero CTA actions"]');
      expect(ctaSection).toBeInTheDocument();
    });
  });

  describe('Overlay Styles', () => {
    it('applies gradient overlay for horizontal position with background', () => {
      const blok = createMockBlok({
        position: 'horizontal',
        background_image: {
          id: 1,
          filename: '/bg.jpg',
          alt: 'Background',
        },
      });
      const { container } = render(<Hero blok={blok} />);

      const overlay = container.querySelector('.lg\\:bg-gradient-to-r');
      expect(overlay).toBeInTheDocument();
    });

    it('applies reverse gradient for horizontal-reverse with background', () => {
      const blok = createMockBlok({
        position: 'horizontal-reverse',
        background_image: {
          id: 1,
          filename: '/bg.jpg',
          alt: 'Background',
        },
      });
      const { container } = render(<Hero blok={blok} />);

      const overlay = container.querySelector('.lg\\:bg-gradient-to-l');
      expect(overlay).toBeInTheDocument();
    });

    it('applies solid overlay for vertical position', () => {
      const blok = createMockBlok({
        position: 'vertical',
        background_image: {
          id: 1,
          filename: '/bg.jpg',
          alt: 'Background',
        },
      });
      const { container } = render(<Hero blok={blok} />);

      const overlay = container.querySelector('.bg-black\\/65');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Content Width', () => {
    it('applies half width to image in horizontal layout', () => {
      const blok = createMockBlok({
        position: 'horizontal',
        image: {
          id: 1,
          filename: '/hero.jpg',
          alt: 'Hero',
        },
      });
      render(<Hero blok={blok} />);

      const figure = screen.getByRole('figure');
      expect(figure).toHaveClass('lg:w-1/2');
    });

    it('applies half width to content in horizontal layout with image', () => {
      const blok = createMockBlok({
        position: 'horizontal',
        image: {
          id: 1,
          filename: '/hero.jpg',
          alt: 'Hero',
        },
      });
      const { container } = render(<Hero blok={blok} />);

      const content = container.querySelector('[aria-label="Hero section content"]');
      expect(content).toHaveClass('lg:w-1/2');
    });

    it('applies full width to content in horizontal layout without image', () => {
      const blok = createMockBlok({
        position: 'horizontal-reverse',
        image: undefined,
      });
      const { container } = render(<Hero blok={blok} />);

      const content = container.querySelector('[aria-label="Hero section content"]');
      expect(content).toHaveClass('lg:w-full');
    });
  });

  describe('No Content', () => {
    it('does not render content section when no content provided', () => {
      const blok: HeroBlockBlok = {
        _uid: 'test-uid',
        component: 'hero_block',
        heading: '', // empty heading
        eyebrow: undefined,
        sub_heading: undefined,
        cta_group: [],
        position: 'vertical',
      };
      const { container } = render(<Hero blok={blok} />);

      const content = container.querySelector('[aria-label="Hero section content"]');
      expect(content).not.toBeInTheDocument();
    });
  });

  describe('Vertical-Reverse Position', () => {
    it('applies vertical-reverse container classes', () => {
      const blok = createMockBlok({
        position: 'vertical-reverse',
      });
      const { container } = render(<Hero blok={blok} />);

      const containerDiv = container.querySelector('.lg\\:flex-col');
      expect(containerDiv).toBeInTheDocument();
    });
  });
});

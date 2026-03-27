import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  default: ({ src, alt, fill, priority, width, height, sizes, ...props }: {
    src: string;
    alt: string;
    fill?: boolean;
    priority?: boolean;
    width?: number;
    height?: number;
    sizes?: string;
    [key: string]: unknown;
  }) => (
    <div
      data-src={src}
      data-alt={alt}
      role="img"
      aria-label={alt}
      {...(fill && { 'data-fill': 'true' })}
      {...(priority && { 'data-priority': 'true' })}
      {...(width !== undefined && { 'data-width': String(width) })}
      {...(height !== undefined && { 'data-height': String(height) })}
      {...(sizes && { 'data-sizes': sizes })}
      data-testid="next-image"
      {...props}
    />
  ),
}));

// Mock console.warn to avoid cluttering test output
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

beforeEach(() => {
  consoleWarnSpy.mockClear();
});

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

      expect(container.querySelector(String.raw`.lg\:flex-row-reverse`)).toBeInTheDocument();
    });

    it('renders horizontal-reverse position', () => {
      const blok = createMockBlok({ position: 'horizontal-reverse' });
      const { container } = render(<Hero blok={blok} />);

      expect(container.querySelector(String.raw`.lg\:flex-row`)).toBeInTheDocument();
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

      const overlay = container.querySelector(String.raw`.lg\:bg-gradient-to-r`);
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

      const overlay = container.querySelector(String.raw`.lg\:bg-gradient-to-l`);
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

      const overlay = container.querySelector(String.raw`.bg-black\/70`);
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Content Width', () => {
    it('applies auto width to image by default (no image_type specified)', () => {
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
      expect(figure).toHaveClass('w-auto');
    });

    it('applies full width to content in horizontal layout with auto image type', () => {
      const blok = createMockBlok({
        position: 'horizontal',
        image: {
          id: 1,
          filename: '/hero.jpg',
          alt: 'Hero',
        },
        image_type: 'auto',
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

      const containerDiv = container.querySelector(String.raw`.lg\:flex-col`);
      expect(containerDiv).toBeInTheDocument();
    });
  });

  describe('Image Type Responsive Sizing', () => {
    describe('Auto Image Type', () => {
      it('applies w-auto to figure for auto type', () => {
        const blok = createMockBlok({
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/300x300/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'auto',
        });
        render(<Hero blok={blok} />);

        const figure = screen.getByRole('figure');
        expect(figure).toHaveClass('w-auto');
      });

      it('applies w-auto max-w-full to img for auto type', () => {
        const blok = createMockBlok({
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/300x300/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'auto',
        });
        const { container } = render(<Hero blok={blok} />);

        const img = container.querySelector('[data-testid="next-image"]');
        expect(img).toHaveClass('h-auto', 'max-w-full', 'object-cover', 'w-[300px]');
      });

      it('uses native dimensions for sizes attribute', () => {
        const blok = createMockBlok({
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/300x300/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'auto',
        });
        const { container } = render(<Hero blok={blok} />);

        const img = container.querySelector('[data-testid="next-image"]');
        expect(img).toHaveAttribute('data-sizes', '300px');
      });

      it('defaults to auto when image_type is undefined', () => {
        const blok = createMockBlok({
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/300x300/hash/test.png',
            alt: 'Test image',
          },
          image_type: undefined,
        });
        render(<Hero blok={blok} />);

        const figure = screen.getByRole('figure');
        expect(figure).toHaveClass('w-auto');
      });
    });

    describe('Full Image Type', () => {
      it('applies w-full lg:w-4/5 for full type vertical position', () => {
        const blok = createMockBlok({
          position: 'vertical',
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/1920x1080/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'full',
        });
        render(<Hero blok={blok} />);

        const figure = screen.getByRole('figure');
        expect(figure).toHaveClass('w-full', 'lg:w-4/5');
      });

      it('applies w-full for full type horizontal position', () => {
        const blok = createMockBlok({
          position: 'horizontal',
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/1920x1080/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'full',
        });
        render(<Hero blok={blok} />);

        const figure = screen.getByRole('figure');
        expect(figure).toHaveClass('w-full');
        expect(figure).not.toHaveClass('lg:w-4/5');
      });

      it('applies w-full to img for full type', () => {
        const blok = createMockBlok({
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/1920x1080/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'full',
        });
        const { container } = render(<Hero blok={blok} />);

        const img = container.querySelector('[data-testid="next-image"]');
        expect(img).toHaveClass('w-full');
      });

      it('uses correct sizes for full type horizontal', () => {
        const blok = createMockBlok({
          position: 'horizontal',
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/1920x1080/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'full',
        });
        const { container } = render(<Hero blok={blok} />);

        const img = container.querySelector('[data-testid="next-image"]');
        expect(img).toHaveAttribute('data-sizes', '100vw');
      });

      it('uses correct sizes for full type vertical', () => {
        const blok = createMockBlok({
          position: 'vertical',
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/1920x1080/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'full',
        });
        const { container } = render(<Hero blok={blok} />);

        const img = container.querySelector('[data-testid="next-image"]');
        expect(img).toHaveAttribute('data-sizes', '(min-width: 1024px) 80vw, 100vw');
      });
    });

    describe('Half Image Type', () => {
      it('applies w-full lg:w-1/2 for half type', () => {
        const blok = createMockBlok({
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/800x600/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'half',
        });
        render(<Hero blok={blok} />);

        const figure = screen.getByRole('figure');
        expect(figure).toHaveClass('w-full', 'lg:w-1/2');
      });

      it('applies w-full to img for half type', () => {
        const blok = createMockBlok({
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/800x600/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'half',
        });
        const { container } = render(<Hero blok={blok} />);

        const img = container.querySelector('[data-testid="next-image"]');
        expect(img).toHaveClass('w-full');
      });

      it('uses correct sizes for half type', () => {
        const blok = createMockBlok({
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/800x600/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'half',
        });
        const { container } = render(<Hero blok={blok} />);

        const img = container.querySelector('[data-testid="next-image"]');
        expect(img).toHaveAttribute('data-sizes', '(min-width: 1024px) 50vw, 100vw');
      });
    });

    describe('Dimension Extraction', () => {
      it('extracts and applies correct width/height from URL', () => {
        const blok = createMockBlok({
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/300x200/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'auto',
        });
        const { container } = render(<Hero blok={blok} />);

        const img = container.querySelector('[data-testid="next-image"]');
        expect(img).toHaveAttribute('data-width', '300');
        expect(img).toHaveAttribute('data-height', '200');
      });

      it('uses fallback dimensions for invalid URLs', () => {
        const blok = createMockBlok({
          image: {
            id: 123456789,
            filename: 'https://invalid-url.com/no-dimensions.png',
            alt: 'Test image',
          },
          image_type: 'auto',
        });
        const { container } = render(<Hero blok={blok} />);

        const img = container.querySelector('[data-testid="next-image"]');
        expect(img).toHaveAttribute('data-width', '1920');
        expect(img).toHaveAttribute('data-height', '1080');
      });

      it('logs warning for invalid URL format', () => {
        const blok = createMockBlok({
          image: {
            id: 123456789,
            filename: 'https://invalid-url.com/no-dimensions.png',
            alt: 'Test image',
          },
          image_type: 'auto',
        });
        render(<Hero blok={blok} />);

        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      it('uses fallback dimensions for malformed dimension strings', () => {
        const blok = createMockBlok({
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/invalidx/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'auto',
        });
        const { container } = render(<Hero blok={blok} />);

        const img = container.querySelector('[data-testid="next-image"]');
        expect(img).toHaveAttribute('data-width', '1920');
        expect(img).toHaveAttribute('data-height', '1080');
      });

      it('uses fallback dimensions for zero or negative values', () => {
        const blok = createMockBlok({
          image: {
            id: 123456789,
            filename: 'https://a.storyblok.com/f/12345/0x-100/hash/test.png',
            alt: 'Test image',
          },
          image_type: 'auto',
        });
        const { container } = render(<Hero blok={blok} />);

        const img = container.querySelector('[data-testid="next-image"]');
        expect(img).toHaveAttribute('data-width', '1920');
        expect(img).toHaveAttribute('data-height', '1080');
      });
    });
  });
});

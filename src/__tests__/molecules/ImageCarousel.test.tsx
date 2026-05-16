/* eslint-disable @next/next/no-img-element */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ImageCarousel from '@/components/molecules/ImageCarousel';
import type { StoryblokAsset } from '@/types/storyblok';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill,
    className,
    sizes,
    priority,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    sizes?: string;
    priority?: boolean;
  }) => (
    <img
      src={src}
      alt={alt}
      data-fill={fill}
      data-class-name={className}
      data-sizes={sizes}
      data-priority={priority}
    />
  ),
}));

// Create mock functions at module level
const mockScrollPrev = vi.fn();
const mockScrollNext = vi.fn();
const mockAutoplayStop = vi.fn();
const mockAutoplayPlay = vi.fn();

// Mock autoplay plugin to return callable mocks
const mockAutoplayPlugin = {
  stop: mockAutoplayStop,
  play: mockAutoplayPlay,
};

// Mock embla-carousel-react
vi.mock('embla-carousel-react', () => ({
  default: () => [
    { current: null },
    {
      scrollPrev: mockScrollPrev,
      scrollNext: mockScrollNext,
      plugins: () => ({
        autoplay: {
          stop: mockAutoplayStop,
          play: mockAutoplayPlay,
        },
      }),
    },
  ],
}));

// Mock embla-carousel-autoplay
vi.mock('embla-carousel-autoplay', () => ({
  default: vi.fn(() => mockAutoplayPlugin),
}));

// Mock react-icons/hi2
vi.mock('react-icons/hi2', () => ({
  HiChevronLeft: ({ className }: { className?: string }) => (
    <span data-testid="chevron-left" className={className}>
      Left
    </span>
  ),
  HiChevronRight: ({ className }: { className?: string }) => (
    <span data-testid="chevron-right" className={className}>
      Right
    </span>
  ),
}));

const createMockImage = (overrides: Partial<StoryblokAsset> = {}): StoryblokAsset => ({
  id: 1,
  filename: 'https://example.com/image.jpg',
  alt: 'Test image',
  title: 'Test Image',
  ...overrides,
});

describe('ImageCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Single Image Rendering', () => {
    it('renders single image without arrows', () => {
      const images = [createMockImage()];
      render(<ImageCarousel images={images} />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('alt', 'Test image');
    });

    it('does not render navigation arrows for single image', () => {
      const images = [createMockImage()];
      render(<ImageCarousel images={images} />);

      expect(screen.queryByTestId('chevron-left')).not.toBeInTheDocument();
      expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
    });

    it('renders single image with correct container classes', () => {
      const images = [createMockImage()];
      const { container } = render(<ImageCarousel images={images} />);

      const outerDiv = container.querySelector('.overflow-hidden.rounded-3xl');
      expect(outerDiv).toBeInTheDocument();
    });

    it('renders single image with aspect-video', () => {
      const images = [createMockImage()];
      const { container } = render(<ImageCarousel images={images} />);

      const aspectDiv = container.querySelector('.aspect-video');
      expect(aspectDiv).toBeInTheDocument();
    });
  });

  describe('Multiple Images Rendering', () => {
    it('renders Embla container with multiple images', () => {
      const images = [
        createMockImage({ id: 1, filename: '/image1.jpg', alt: 'Image 1' }),
        createMockImage({ id: 2, filename: '/image2.jpg', alt: 'Image 2' }),
      ];
      render(<ImageCarousel images={images} />);

      const imgs = screen.getAllByRole('img');
      expect(imgs).toHaveLength(2);
    });

    it('renders navigation arrows for multiple images', () => {
      const images = [
        createMockImage({ id: 1 }),
        createMockImage({ id: 2 }),
      ];
      render(<ImageCarousel images={images} />);

      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    it('renders correct number of slides', () => {
      const images = [
        createMockImage({ id: 1 }),
        createMockImage({ id: 2 }),
        createMockImage({ id: 3 }),
      ];
      render(<ImageCarousel images={images} />);

      const imgs = screen.getAllByRole('img');
      expect(imgs).toHaveLength(3);
    });
  });

  describe('Arrow Click Handlers', () => {
    it('calls scrollPrev when left arrow is clicked', () => {
      const images = [
        createMockImage({ id: 1 }),
        createMockImage({ id: 2 }),
      ];
      render(<ImageCarousel images={images} />);

      const leftArrow = screen.getByTestId('chevron-left').parentElement;
      fireEvent.click(leftArrow!);

      expect(mockScrollPrev).toHaveBeenCalledTimes(1);
    });

    it('calls scrollNext when right arrow is clicked', () => {
      const images = [
        createMockImage({ id: 1 }),
        createMockImage({ id: 2 }),
      ];
      render(<ImageCarousel images={images} />);

      const rightArrow = screen.getByTestId('chevron-right').parentElement;
      fireEvent.click(rightArrow!);

      expect(mockScrollNext).toHaveBeenCalledTimes(1);
    });

    it('arrows are inside button elements with correct aria-labels', () => {
      const images = [
        createMockImage({ id: 1 }),
        createMockImage({ id: 2 }),
      ];
      render(<ImageCarousel images={images} />);

      const prevButton = screen.getByRole('button', { name: /previous image/i });
      const nextButton = screen.getByRole('button', { name: /next image/i });

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Autoplay Hover Handlers', () => {
    it('stops autoplay when hovering over arrow buttons', () => {
      const images = [
        createMockImage({ id: 1 }),
        createMockImage({ id: 2 }),
      ];
      render(<ImageCarousel images={images} />);

      const leftArrow = screen.getByTestId('chevron-left').parentElement!;
      act(() => {
        fireEvent.mouseEnter(leftArrow);
      });

      expect(mockAutoplayStop).toHaveBeenCalledTimes(1);
    });

    it('resumes autoplay when leaving arrow buttons', () => {
      const images = [
        createMockImage({ id: 1 }),
        createMockImage({ id: 2 }),
      ];
      render(<ImageCarousel images={images} />);

      const leftArrow = screen.getByTestId('chevron-left').parentElement!;
      act(() => {
        fireEvent.mouseLeave(leftArrow);
      });

      expect(mockAutoplayPlay).toHaveBeenCalledTimes(1);
    });
  });

  describe('hideOnMobile Prop', () => {
    it('applies hidden md:block when hideOnMobile is true (single image)', () => {
      const images = [createMockImage()];
      const { container } = render(<ImageCarousel images={images} hideOnMobile />);

      const carouselContainer = container.querySelector('.hidden.md\\:block');
      expect(carouselContainer).toBeInTheDocument();
    });

    it('applies hidden md:block when hideOnMobile is true (multiple images)', () => {
      const images = [createMockImage({ id: 1 }), createMockImage({ id: 2 })];
      const { container } = render(<ImageCarousel images={images} hideOnMobile />);

      const carouselContainer = container.querySelector('.hidden.md\\:block');
      expect(carouselContainer).toBeInTheDocument();
    });

    it('does not apply hidden classes when hideOnMobile is false', () => {
      const images = [createMockImage()];
      const { container } = render(<ImageCarousel images={images} hideOnMobile={false} />);

      const carouselContainer = container.querySelector('.hidden.md\\:block');
      expect(carouselContainer).not.toBeInTheDocument();
    });

    it('does not apply hidden classes when hideOnMobile is undefined', () => {
      const images = [createMockImage()];
      const { container } = render(<ImageCarousel images={images} />);

      const carouselContainer = container.querySelector('.hidden.md\\:block');
      expect(carouselContainer).not.toBeInTheDocument();
    });
  });

  describe('Carousel container hover — stops/resumes autoplay', () => {
    it('stops autoplay on carousel div mouseEnter', () => {
      const images = [
        createMockImage({ id: 1 }),
        createMockImage({ id: 2 }),
      ];
      const { container } = render(<ImageCarousel images={images} />);

      // The emblaRef div is the 2nd element with rounded-3xl overflow-hidden
      // (outer wrapper also has these classes but no handler)
      const allDivs = Array.from(container.querySelectorAll('.rounded-3xl.overflow-hidden')) as HTMLElement[];
      // The inner emblaRef div comes after the outer wrapper
      const emblaDiv = allDivs.find(el => el.parentElement?.classList.contains('rounded-3xl')) ?? allDivs[allDivs.length - 1];
      act(() => {
        fireEvent.mouseEnter(emblaDiv);
      });

      expect(mockAutoplayStop).toHaveBeenCalled();
    });

    it('resumes autoplay on carousel div mouseLeave', () => {
      const images = [
        createMockImage({ id: 1 }),
        createMockImage({ id: 2 }),
      ];
      const { container } = render(<ImageCarousel images={images} />);

      const allDivs = Array.from(container.querySelectorAll('.rounded-3xl.overflow-hidden')) as HTMLElement[];
      const emblaDiv = allDivs.find(el => el.parentElement?.classList.contains('rounded-3xl')) ?? allDivs[allDivs.length - 1];
      act(() => {
        fireEvent.mouseLeave(emblaDiv);
      });

      expect(mockAutoplayPlay).toHaveBeenCalled();
    });
  });

  describe('Image Properties', () => {
    it('uses alt text when available', () => {
      const images = [createMockImage({ alt: 'Custom alt text' })];
      render(<ImageCarousel images={images} />);

      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Custom alt text');
    });

    it('falls back to title when alt is not available', () => {
      const images = [createMockImage({ alt: undefined, title: 'Fallback Title' })];
      render(<ImageCarousel images={images} />);

      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Fallback Title');
    });

    it('uses empty string when neither alt nor title is available', () => {
      const images = [createMockImage({ alt: undefined, title: undefined })];
      const { container } = render(<ImageCarousel images={images} />);

      // Find the img element by src attribute since it has no accessible role
      const img = container.querySelector('img');
      expect(img).toHaveAttribute('alt', '');
    });

    it('uses title fallback in multi-image carousel (covers alt || title branch)', () => {
      // Multiple images triggers Embla carousel path (lines 71-85)
      const images = [
        createMockImage({ id: 1, alt: undefined, title: 'Slide One' }),
        createMockImage({ id: 2, alt: 'Slide Two Alt', title: 'Slide Two' }),
      ];
      const { container } = render(<ImageCarousel images={images} />);

      const imgs = container.querySelectorAll('img');
      expect(imgs[0]).toHaveAttribute('alt', 'Slide One');
      expect(imgs[1]).toHaveAttribute('alt', 'Slide Two Alt');
    });

    it('uses empty string when both alt and title absent in multi-image carousel (|| "" branch)', () => {
      const images = [
        createMockImage({ id: 1, alt: undefined, title: undefined }),
        createMockImage({ id: 2, alt: undefined, title: undefined }),
      ];
      const { container } = render(<ImageCarousel images={images} />);

      const imgs = container.querySelectorAll('img');
      expect(imgs[0]).toHaveAttribute('alt', '');
    });
  });

  describe('Container Classes', () => {
    it('applies mt-auto class', () => {
      const images = [createMockImage()];
      const { container } = render(<ImageCarousel images={images} />);

      const outerDiv = container.querySelector('.mt-auto');
      expect(outerDiv).toBeInTheDocument();
    });

    it('applies overflow-hidden and rounded-xl classes', () => {
      const images = [createMockImage()];
      const { container } = render(<ImageCarousel images={images} />);

      const outerDiv = container.querySelector('.overflow-hidden.rounded-3xl');
      expect(outerDiv).toBeInTheDocument();
    });
  });
});

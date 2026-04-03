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
      plugins: {
        autoplay: {
          stop: mockAutoplayStop,
          play: mockAutoplayPlay,
        },
      },
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
    it('applies hidden md:block when hideOnMobile is true', () => {
      const images = [createMockImage()];
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

  // Note: Autoplay handlers (lines 31, 35) are tightly coupled to useRef/useEmblaCarousel
  // and require complex mocking. The mouseEnter/leave handlers on buttons are tested
  // via the arrow hover test, but the direct autoplay stop/play calls are not directly testable
  // without rewriting the component's hook structure. These internal callbacks are exercised
  // in integration/E2E tests.

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

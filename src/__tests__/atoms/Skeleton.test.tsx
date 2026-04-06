import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, CardSkeleton, ImageCarouselSkeleton } from '@/components/atoms/Skeleton';

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(<Skeleton />);
      }).not.toThrow();
    });

    it('renders as div element', () => {
      const { container } = render(<Skeleton />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('has animate-pulse class', () => {
      const { container } = render(<Skeleton />);
      const element = container.querySelector('div');
      expect(element).toHaveClass('animate-pulse');
    });

    it('has bg-gray-200 class', () => {
      const { container } = render(<Skeleton />);
      const element = container.querySelector('div');
      expect(element).toHaveClass('bg-gray-200');
    });

    it('has rounded-md class', () => {
      const { container } = render(<Skeleton />);
      const element = container.querySelector('div');
      expect(element).toHaveClass('rounded-md');
    });

    it('has aria-hidden="true"', () => {
      const { container } = render(<Skeleton />);
      const element = container.querySelector('div');
      expect(element).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies custom className', () => {
      const { container } = render(<Skeleton className="h-10 w-32" />);
      const element = container.querySelector('div');
      expect(element).toHaveClass('h-10', 'w-32');
    });

    it('merges custom className with default classes', () => {
      const { container } = render(<Skeleton className="h-10" />);
      const element = container.querySelector('div');
      expect(element).toHaveClass('animate-pulse', 'bg-gray-200', 'rounded-md', 'h-10');
    });
  });

  describe('CardSkeleton', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(<CardSkeleton />);
      }).not.toThrow();
    });

    it('renders as div element', () => {
      const { container } = render(<CardSkeleton />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('has aria-hidden="true"', () => {
      const { container } = render(<CardSkeleton />);
      const mainElement = container.querySelector('div');
      expect(mainElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('has flex flex-col classes', () => {
      const { container } = render(<CardSkeleton />);
      const mainElement = container.querySelector('div');
      expect(mainElement).toHaveClass('flex', 'flex-col');
    });

    it('has correct layout classes', () => {
      const { container } = render(<CardSkeleton />);
      const mainElement = container.querySelector('div');
      expect(mainElement).toHaveClass(
        'h-full',
        'bg-background',
        'rounded-xl',
        'shadow-sm',
        'border',
        'border-gray-200'
      );
    });

    it('has responsive width classes', () => {
      const { container } = render(<CardSkeleton />);
      const mainElement = container.querySelector('div');
      expect(mainElement).toHaveClass('max-w-full', 'lg:max-w-[320px]', 'xl:max-w-full');
    });

    it('renders image skeleton with correct aspect ratio', () => {
      const { container } = render(<CardSkeleton />);
      const cardContainer = container.querySelector('div');
      const imageSkeleton = cardContainer?.querySelector('div');
      expect(imageSkeleton).toHaveClass('animate-pulse', 'aspect-16/10');
    });

    it('renders text skeletons for content', () => {
      const { container } = render(<CardSkeleton />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      // Should have image + 3 text skeletons
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it('renders content wrapper with flex layout', () => {
      const { container } = render(<CardSkeleton />);
      const contentWrapper = container.querySelector('div > div:nth-child(2)');
      expect(contentWrapper).toHaveClass('flex', 'flex-col', 'gap-3', 'p-4');
    });

    it('applies custom className', () => {
      const { container } = render(<CardSkeleton className="custom-class" />);
      const mainElement = container.querySelector('div');
      expect(mainElement).toHaveClass('custom-class');
    });
  });

  describe('ImageCarouselSkeleton', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(<ImageCarouselSkeleton />);
      }).not.toThrow();
    });

    it('renders as div element', () => {
      const { container } = render(<ImageCarouselSkeleton />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('has aria-hidden="true"', () => {
      const { container } = render(<ImageCarouselSkeleton />);
      const mainElement = container.querySelector('div');
      expect(mainElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('has overflow-hidden class', () => {
      const { container } = render(<ImageCarouselSkeleton />);
      const mainElement = container.querySelector('div');
      expect(mainElement).toHaveClass('overflow-hidden');
    });

    it('has rounded-3xl class', () => {
      const { container } = render(<ImageCarouselSkeleton />);
      const mainElement = container.querySelector('div');
      expect(mainElement).toHaveClass('rounded-3xl');
    });

    it('has border-10 border-white classes', () => {
      const { container } = render(<ImageCarouselSkeleton />);
      const mainElement = container.querySelector('div');
      expect(mainElement).toHaveClass('border-10', 'border-white');
    });

    it('renders image skeleton with aspect-video', () => {
      const { container } = render(<ImageCarouselSkeleton />);
      const carouselContainer = container.querySelector('div');
      const imageSkeleton = carouselContainer?.querySelector('div');
      expect(imageSkeleton).toHaveClass('animate-pulse', 'aspect-video', 'w-full', 'rounded-3xl');
    });

    it('applies custom className', () => {
      const { container } = render(<ImageCarouselSkeleton className="custom-class" />);
      const mainElement = container.querySelector('div');
      expect(mainElement).toHaveClass('custom-class');
    });
  });

  describe('Integration', () => {
    it('CardSkeleton uses Skeleton component for placeholders', () => {
      const { container } = render(<CardSkeleton />);
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      // Should have multiple skeleton elements
      expect(skeletons.length).toBeGreaterThan(1);
    });

    it('ImageCarouselSkeleton uses Skeleton component', () => {
      const { container } = render(<ImageCarouselSkeleton />);
      const skeleton = container.querySelector('[class*="animate-pulse"]');
      expect(skeleton).toBeInTheDocument();
    });

    it('all skeletons are hidden from assistive technology', () => {
      const { container: cardContainer } = render(<CardSkeleton />);
      const { container: imageContainer } = render(<ImageCarouselSkeleton />);
      const { container: skeletonContainer } = render(<Skeleton />);

      const cardMain = cardContainer.querySelector('div');
      const imageMain = imageContainer.querySelector('div');
      const skeletonMain = skeletonContainer.querySelector('div');

      expect(cardMain).toHaveAttribute('aria-hidden', 'true');
      expect(imageMain).toHaveAttribute('aria-hidden', 'true');
      expect(skeletonMain).toHaveAttribute('aria-hidden', 'true');
    });
  });
});

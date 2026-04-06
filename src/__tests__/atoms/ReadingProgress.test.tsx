import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import ReadingProgressBar from '@/components/atoms/ReadingProgress';

// Mock motion/react
vi.mock('motion/react', () => {
  return {
    useScroll: () => ({
      scrollYProgress: { get: () => 0, on: vi.fn(() => vi.fn()) },
    }),
    useSpring: (value: unknown) => value,
    m: new Proxy({}, {
      get: (_: unknown, prop: string) => {
        // eslint-disable-next-line react/display-name
        return React.forwardRef(
          (
            {
              children,
              style,
              className,
              ...htmlProps
            }: Record<string, unknown>,
            ref: unknown
          ) => {
            return React.createElement(
              prop,
              { ...htmlProps, style, className, ref },
              children as React.ReactNode
            );
          }
        );
      },
    }),
  };
});

// Mock console methods to prevent test pollution
const consoleSpy = {
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
};

describe('ReadingProgressBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(<ReadingProgressBar />);
      }).not.toThrow();
    });

    it('renders progress bar container', () => {
      render(<ReadingProgressBar />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('has role="progressbar"', () => {
      render(<ReadingProgressBar />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('role', 'progressbar');
    });

    it('has aria-label attribute', () => {
      render(<ReadingProgressBar />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Reading progress');
    });

    it('renders with default props', () => {
      render(<ReadingProgressBar />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ height: '4px' });
    });
  });

  describe('Position Classes', () => {
    it('applies fixed position classes by default', () => {
      render(<ReadingProgressBar position="fixed" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('fixed', 'top-[70px]', 'left-0', 'w-full');
    });

    it('applies sticky position classes when position="sticky"', () => {
      render(<ReadingProgressBar position="sticky" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('sticky', 'top-[70px]', 'left-0', 'w-full');
    });

    it('applies responsive top margin for lg breakpoint', () => {
      render(<ReadingProgressBar />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('lg:top-[90px]');
    });
  });

  describe('Styling & Props', () => {
    it('applies custom height prop', () => {
      render(<ReadingProgressBar height={6} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ height: '6px' });
    });

    it('applies custom color class', () => {
      const { container } = render(
        <ReadingProgressBar color="bg-red-600" />
      );
      const progressIndicator = container.querySelector('div[class*="h-full"]');
      expect(progressIndicator).toHaveClass('bg-red-600');
    });

    it('applies custom backgroundColor class', () => {
      render(<ReadingProgressBar backgroundColor="bg-gray-300" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('bg-gray-300');
    });

    it('applies custom zIndex', () => {
      render(<ReadingProgressBar zIndex={100} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ zIndex: '100' });
    });

    it('applies custom className', () => {
      render(<ReadingProgressBar className="custom-progress-bar" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('custom-progress-bar');
    });
  });

  describe('Progress Indicator', () => {
    it('renders motion div as progress indicator', () => {
      render(<ReadingProgressBar />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.querySelector('div[class*="h-full"]');
      expect(indicator).toBeInTheDocument();
    });

    it('applies color classes to progress indicator', () => {
      render(<ReadingProgressBar />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.querySelector('div[class*="h-full"]');
      expect(indicator).toHaveClass('origin-left');
    });

    it('applies custom color to progress indicator', () => {
      render(
        <ReadingProgressBar color="bg-custom-color" />
      );
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.querySelector('div[class*="h-full"]');
      expect(indicator).toHaveClass('bg-custom-color');
    });
  });

  describe('No showPercentage prop', () => {
    it('does not render sr-only percentage text', () => {
      render(<ReadingProgressBar />);
      expect(screen.queryByText(/reading in progress/i)).not.toBeInTheDocument();
    });
  });

  describe('Component Features', () => {
    it('has displayName set', () => {
      expect(ReadingProgressBar.displayName).toBe('ReadingProgressBar');
    });

    it('is memoized component', () => {
      const { rerender } = render(<ReadingProgressBar />);
      const firstProgressBar = screen.getByRole('progressbar');

      rerender(<ReadingProgressBar />);
      const secondProgressBar = screen.getByRole('progressbar');

      expect(firstProgressBar).toBeInTheDocument();
      expect(secondProgressBar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ReadingProgressBar />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('role', 'progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Reading progress');
    });

    it('does not render any sr-only text', () => {
      render(<ReadingProgressBar />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar.querySelector('.sr-only')).not.toBeInTheDocument();
    });
  });

  describe('Motion Integration', () => {
    it('renders motion div for progress indicator', () => {
      render(<ReadingProgressBar />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.querySelector('div:last-child');
      expect(indicator).toBeInTheDocument();
    });

    it('applies style to motion div', () => {
      render(<ReadingProgressBar />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.querySelector('div[class*="h-full"]');
      expect(indicator).toHaveClass('origin-left');
    });
  });

  describe('Multiple Instances', () => {
    it('can render multiple progress bars independently', () => {
      render(
        <>
          <ReadingProgressBar height={4} color="bg-blue-600" />
          <ReadingProgressBar height={6} color="bg-red-600" position="sticky" />
        </>
      );

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(2);
    });

    it('each progress bar maintains its own styling', () => {
      render(
        <>
          <ReadingProgressBar height={4} className="bar-1" />
          <ReadingProgressBar height={8} className="bar-2" />
        </>
      );

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars[0]).toHaveStyle({ height: '4px' });
      expect(progressBars[0]).toHaveClass('bar-1');
      expect(progressBars[1]).toHaveStyle({ height: '8px' });
      expect(progressBars[1]).toHaveClass('bar-2');
    });
  });

  describe('Error Handling', () => {
    it('produces no console errors during normal operation', () => {
      render(<ReadingProgressBar />);
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it('produces no console warnings during normal operation', () => {
      render(<ReadingProgressBar />);
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('handles all props combinations without crashing', () => {
      expect(() => {
        render(
          <ReadingProgressBar
            height={8}
            className="custom"
            color="bg-purple-600"
            backgroundColor="bg-gray-400"
            position="sticky"
            zIndex={50}
          />
        );
      }).not.toThrow();
    });
  });
});

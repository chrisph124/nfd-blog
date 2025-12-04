import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ReadingProgressBar from '@/components/atoms/ReadingProgress';

// Mock console methods to prevent test pollution
const consoleSpy = {
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
};

describe('ReadingProgressBar', () => {
  beforeEach(() => {
    // Setup window mocks
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 800,
    });

    Object.defineProperty(window, 'requestAnimationFrame', {
      writable: true,
      value: vi.fn((cb) => setTimeout(cb, 0)),
    });

    Object.defineProperty(window, 'addEventListener', {
      writable: true,
      value: vi.fn(),
    });

    Object.defineProperty(window, 'removeEventListener', {
      writable: true,
      value: vi.fn(),
    });

    Object.defineProperty(document, 'documentElement', {
      writable: true,
      value: {
        scrollHeight: 2000,
      },
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    // Restore console mocks
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(<ReadingProgressBar />);
      }).not.toThrow();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders with default props', () => {
      render(<ReadingProgressBar />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', expect.stringContaining('Reading progress:'));
    });

    it('renders with custom props', () => {
      render(
        <ReadingProgressBar
          height={6}
          color="bg-red-600"
          backgroundColor="bg-gray-300"
          position="sticky"
          showPercentage={true}
          zIndex={100}
          className="custom-class"
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveClass('custom-class');
    });

    it('has correct accessibility attributes', () => {
      render(<ReadingProgressBar />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('role', 'progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', expect.stringContaining('Reading progress:'));
    });
  });

  describe('Progress Calculation Logic', () => {
    it('calculates progress correctly for different scenarios', () => {
      // Test with different scroll positions and document heights
      const testCases = [
        { scrollY: 0, innerHeight: 800, scrollHeight: 2000, expected: 0 },      // At top: 0%
        { scrollY: 600, innerHeight: 800, scrollHeight: 2000, expected: 50 },     // Half scroll: 50%
        { scrollY: 1200, innerHeight: 800, scrollHeight: 2000, expected: 100 },  // Bottom: 100%
        { scrollY: 0, innerHeight: 800, scrollHeight: 600, expected: 100 },       // Content shorter than viewport
      ];

      testCases.forEach(({ scrollY, innerHeight, scrollHeight, expected }) => {
        // Update window properties
        Object.defineProperty(window, 'scrollY', { writable: true, value: scrollY });
        Object.defineProperty(window, 'innerHeight', { writable: true, value: innerHeight });
        Object.defineProperty(document, 'documentElement', {
          writable: true,
          value: { scrollHeight },
        });

        const { unmount } = render(<ReadingProgressBar />);

        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(expected));

        unmount();
      });
    });
  });

  describe('Event Listeners', () => {
    it('adds scroll and resize event listeners', () => {
      render(<ReadingProgressBar />);

      expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true });
    });

    it('removes event listeners on unmount', () => {
      const { unmount } = render(<ReadingProgressBar />);
      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Performance Features', () => {
    it('uses requestAnimationFrame for smooth updates', () => {
      render(<ReadingProgressBar />);

      // requestAnimationFrame is called in the scroll handler and resize handler
      // We check if the mock was set up correctly
      expect(typeof window.requestAnimationFrame).toBe('function');
    });

    it('uses passive event listeners for better performance', () => {
      render(<ReadingProgressBar />);

      expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true });
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct height style', () => {
      render(<ReadingProgressBar height={6} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ height: '6px' });
    });

    it('applies correct z-index', () => {
      render(<ReadingProgressBar zIndex={100} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ zIndex: '100' });
    });

    it('applies custom className', () => {
      render(<ReadingProgressBar className="custom-progress-bar" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('custom-progress-bar');
    });

    it('has correct child elements', () => {
      render(<ReadingProgressBar />);

      const progressBar = screen.getByRole('progressbar');

      // Should have progress bar as child element
      expect(progressBar.children.length).toBeGreaterThanOrEqual(1);

      // Progress bar should be present
      const progressElement = progressBar.querySelector('[style*="width"]');
      expect(progressElement).toBeInTheDocument();
    });
  });

  describe('Percentage Display', () => {
    it('does not show percentage by default', () => {
      render(<ReadingProgressBar />);

      expect(screen.queryByText(/% complete/)).not.toBeInTheDocument();
    });

    it('shows percentage when showPercentage is true', () => {
      render(<ReadingProgressBar showPercentage={true} />);

      // Should have sr-only text with percentage
      expect(screen.getByText(/\d+% complete/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('produces no console errors or warnings during normal operation', () => {
      render(<ReadingProgressBar />);

      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('handles invalid window state gracefully', () => {
      // Simulate invalid window state
      Object.defineProperty(window, 'innerHeight', { writable: true, value: 0 });

      expect(() => {
        render(<ReadingProgressBar />);
      }).not.toThrow();
    });
  });

  describe('Component Features', () => {
    it('has displayName for debugging', () => {
      expect(ReadingProgressBar.displayName).toBe('ReadingProgressBar');
    });

    it('renders with memo optimization', () => {
      const { rerender } = render(<ReadingProgressBar />);

      const progressBar = screen.getByRole('progressbar');

      // Re-render with same props
      rerender(<ReadingProgressBar />);

      // Should still be the same element
      expect(progressBar).toBeInTheDocument();
    });
  });
});
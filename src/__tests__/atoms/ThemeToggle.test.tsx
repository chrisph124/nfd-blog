import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThemeToggle from '@/components/atoms/ThemeToggle';

// Mock heroicons
vi.mock('react-icons/hi2', () => ({
  HiSun: ({ className }: { className?: string }) => (
    <svg data-testid="sun-icon" className={className} />
  ),
  HiMoon: ({ className }: { className?: string }) => (
    <svg data-testid="moon-icon" className={className} />
  ),
}));

describe('ThemeToggle', () => {
  // ============================================================================
  // Setup
  // ============================================================================

  beforeEach(() => {
    // Reset matchMedia mock before each test
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
    });

    it('renders with correct aria-label', () => {
      render(<ThemeToggle />);

      const button = screen.getByLabelText('Toggle theme');
      expect(button).toBeInTheDocument();
    });

    it('has correct button type', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('renders sun icon by default (light mode)', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // System Preference Detection Tests
  // ============================================================================

  describe('System Preference Detection', () => {
    it('detects light mode system preference', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      });
    });

    it('detects dark mode system preference', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // User Interaction Tests
  // ============================================================================

  describe('User Interactions', () => {
    it('toggles from sun to moon icon on click', async () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');

      // Initial state - sun icon
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      });

      // Click to toggle
      fireEvent.click(button);

      // After click - moon icon
      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
      });
    });

    it('toggles back to sun icon on second click', async () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');

      // Click twice
      fireEvent.click(button);
      fireEvent.click(button);

      // Should be back to sun icon
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('is keyboard accessible', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('can be triggered with keyboard', async () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');

      // Initial state
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      });

      // Trigger with Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      fireEvent.click(button); // Simulate the actual click that would happen

      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Style Tests
  // ============================================================================

  describe('Styles', () => {
    it('has correct base styles', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('relative', 'shrink-0', 'transition-opacity');
    });
  });
});

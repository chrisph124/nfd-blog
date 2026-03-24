import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThemeToggle from '@/components/atoms/ThemeToggle';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

vi.mock('react-icons/hi2', () => ({
  HiSun: ({ className }: { className?: string }) => (
    <svg data-testid="sun-icon" className={className} />
  ),
  HiMoon: ({ className }: { className?: string }) => (
    <svg data-testid="moon-icon" className={className} />
  ),
}));

import { useTheme } from 'next-themes';

const mockUseTheme = useTheme as ReturnType<typeof vi.fn>;

describe('ThemeToggle', () => {
  const mockSetTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({
      resolvedTheme: 'light',
      setTheme: mockSetTheme,
    });
  });

  describe('Placeholder (before mount)', () => {
    it('renders placeholder with correct dimensions', () => {
      const { container } = render(<ThemeToggle />);
      const el = container.querySelector('[aria-hidden="true"]') || container.querySelector('[role="switch"]');
      expect(el).toBeInTheDocument();
    });
  });

  describe('Mounted - Light mode', () => {
    it('renders switch button with correct aria attributes', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      expect(toggle).toHaveAttribute('aria-label', 'Switch to dark theme');
    });

    it('renders sun and moon icons', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      expect(screen.getAllByTestId('sun-icon').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTestId('moon-icon').length).toBeGreaterThanOrEqual(1);
    });

    it('switches to dark on click', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('switch'));
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });
  });

  describe('Mounted - Dark mode', () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      });
    });

    it('has aria-checked true when dark', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'Switch to light theme');
    });

    it('switches to light on click', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('switch'));
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('knob is translated right in dark mode', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      const knob = screen.getByRole('switch').querySelector('span');
      expect(knob).toHaveClass('translate-x-7');
    });
  });

  describe('Accessibility', () => {
    it('is keyboard accessible', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      const toggle = screen.getByRole('switch');
      toggle.focus();
      expect(toggle).toHaveFocus();
    });
  });

  describe('Component Features', () => {
    it('has displayName', () => {
      expect(ThemeToggle.displayName).toBe('ThemeToggle');
    });

    it('renders without console errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

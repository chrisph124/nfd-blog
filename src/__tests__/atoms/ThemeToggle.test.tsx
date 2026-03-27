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
    it('renders and mounts without crashing', () => {
      const { container } = render(<ThemeToggle />);
      // Component either shows placeholder or mounted button
      const el = container.querySelector('[aria-hidden="true"]') || container.querySelector('button');
      expect(el).toBeInTheDocument();
    });
  });

  describe('Mounted - Light mode', () => {
    it('renders button with correct aria-label', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('aria-label', 'Switch to dark theme');
    });

    it('renders moon icon in light mode', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    });

    it('switches to dark on click', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button'));
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

    it('renders button with correct aria-label in dark mode', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to light theme');
    });

    it('renders sun icon in dark mode', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    });

    it('switches to light on click', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button'));
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  describe('Accessibility', () => {
    it('is keyboard accessible', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const btn = screen.getByRole('button');
      btn.focus();
      expect(btn).toHaveFocus();
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
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

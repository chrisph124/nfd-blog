import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NavItem from '@/components/molecules/NavItem';
import type { NavItemBlok } from '@/types/storyblok';

// Mock react-icons/hi2
vi.mock('react-icons/hi2', () => ({
  HiChevronDown: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-down-icon" className={className} />
  ),
}));

const createMockBlok = (overrides: Partial<NavItemBlok> = {}): NavItemBlok => ({
  _uid: 'test-uid',
  component: 'nav_item',
  label: 'Nav Link',
  link: {
    cached_url: '/test-page',
    linktype: 'story',
  },
  has_dropdown: false,
  ...overrides,
});

describe('NavItem', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      render(<NavItem blok={blok} />);

      expect(screen.getByText('Nav Link')).toBeInTheDocument();
    });

    it('renders as a link', () => {
      const blok = createMockBlok();
      render(<NavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test-page');
    });

    it('renders label text', () => {
      const blok = createMockBlok({ label: 'Custom Label' });
      render(<NavItem blok={blok} />);

      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('uses default label when not provided', () => {
      const blok = createMockBlok({ label: undefined });
      render(<NavItem blok={blok} />);

      expect(screen.getByText('Link')).toBeInTheDocument();
    });

    it('uses cached_url for href', () => {
      const blok = createMockBlok({
        link: {
          cached_url: '/cached-page',
          url: '/regular-page',
          linktype: 'story',
        },
      });
      render(<NavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/cached-page');
    });

    it('falls back to url when cached_url is not available', () => {
      const blok = createMockBlok({
        link: {
          url: '/regular-page',
          linktype: 'story',
        },
      });
      render(<NavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/regular-page');
    });

    it('falls back to # when no URL is provided', () => {
      const blok = createMockBlok({
        link: undefined,
      });
      render(<NavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#');
    });
  });

  describe('Dropdown Indicator', () => {
    it('shows chevron icon when has_dropdown is true', () => {
      const blok = createMockBlok({ has_dropdown: true });
      render(<NavItem blok={blok} />);

      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('hides chevron icon when has_dropdown is false', () => {
      const blok = createMockBlok({ has_dropdown: false });
      render(<NavItem blok={blok} />);

      expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    });

    it('hides chevron icon when has_dropdown is undefined', () => {
      const blok = createMockBlok({ has_dropdown: undefined });
      render(<NavItem blok={blok} />);

      expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('applies active styles when isActive is true', () => {
      const blok = createMockBlok();
      blok.isActive = true;
      render(<NavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('border-b', 'border-primary-700', 'text-primary-800', 'font-bold');
    });

    it('applies inactive styles when isActive is false', () => {
      const blok = createMockBlok();
      render(<NavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('text-foreground', 'font-normal');
    });
  });

  describe('Styles', () => {
    it('has flex layout with gap', () => {
      const blok = createMockBlok();
      render(<NavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('flex', 'items-center');
    });

    it('has hover transition', () => {
      const blok = createMockBlok();
      render(<NavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('hover:text-primary-700', 'transition-colors');
    });

    it('label has correct typography classes', () => {
      const blok = createMockBlok();
      const { container } = render(<NavItem blok={blok} />);

      const span = container.querySelector('span');
      expect(span).toHaveClass('subtitle-1');
    });
  });
});

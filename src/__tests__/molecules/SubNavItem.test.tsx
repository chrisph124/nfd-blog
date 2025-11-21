import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SubNavItem from '@/components/molecules/SubNavItem';
import type { SubNavItemBlok, StoryblokLink } from '@/types/storyblok';

const createMockBlok = (overrides: Partial<SubNavItemBlok> = {}): SubNavItemBlok => ({
  _uid: 'test-uid',
  component: 'sub_nav_item',
  label: 'Sub Nav Link',
  link: {
    cached_url: '/sub-page',
    linktype: 'story',
  } as StoryblokLink,
  ...overrides,
});

describe('SubNavItem', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      render(<SubNavItem blok={blok} />);

      expect(screen.getByText('Sub Nav Link')).toBeInTheDocument();
    });

    it('renders as a link', () => {
      const blok = createMockBlok();
      render(<SubNavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/sub-page');
    });

    it('renders label in paragraph tag', () => {
      const blok = createMockBlok({ label: 'Custom Label' });
      render(<SubNavItem blok={blok} />);

      const paragraph = screen.getByText('Custom Label');
      expect(paragraph.tagName).toBe('P');
    });
  });

  describe('Props Handling', () => {
    it('uses default label when not provided', () => {
      const blok = createMockBlok({ label: undefined as unknown as string });
      render(<SubNavItem blok={blok} />);

      expect(screen.getByText('Link')).toBeInTheDocument();
    });

    it('uses cached_url for href', () => {
      const blok = createMockBlok({
        link: {
          cached_url: '/cached-sub-page',
          url: '/regular-sub-page',
          linktype: 'story',
        },
      });
      render(<SubNavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/cached-sub-page');
    });

    it('falls back to url when cached_url is not available', () => {
      const blok = createMockBlok({
        link: {
          url: '/regular-sub-page',
          linktype: 'story',
        },
      });
      render(<SubNavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/regular-sub-page');
    });

    it('falls back to # when no URL is provided', () => {
      const blok = createMockBlok({
        link: {
          linktype: 'story',
        },
      });
      render(<SubNavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#');
    });
  });

  describe('Styles', () => {
    it('has correct link styles', () => {
      const blok = createMockBlok();
      render(<SubNavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass(
        'flex',
        'items-center',
        'justify-between',
        'transition-colors'
      );
    });

    it('has correct padding', () => {
      const blok = createMockBlok();
      render(<SubNavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('px-[16px]', 'py-[12px]');
    });

    it('has hover background style', () => {
      const blok = createMockBlok();
      render(<SubNavItem blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('hover:bg-secondary-200');
    });

    it('label has correct typography classes', () => {
      const blok = createMockBlok();
      render(<SubNavItem blok={blok} />);

      const paragraph = screen.getByText('Sub Nav Link');
      expect(paragraph).toHaveClass('font-medium', 'text-gray-700');
    });
  });
});

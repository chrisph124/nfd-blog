import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Cta from '@/components/atoms/Cta';
import type { CtaBlok } from '@/types/storyblok';

// Mock heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  ArrowRightIcon: ({ className }: { className?: string }) => (
    <svg data-testid="arrow-right-icon" className={className} />
  ),
}));

// Helper function to create mock blok
const createMockBlok = (overrides: Partial<CtaBlok> = {}): CtaBlok => ({
  _uid: 'test-uid',
  component: 'cta',
  label: 'Click me',
  navigate_to: {
    cached_url: '/test-page',
    linktype: 'story',
  },
  cta_type: 'primary',
  cta_size: 'hug',
  ...overrides,
});

describe('Cta', () => {
  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      render(<Cta blok={blok} />);

      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders label text correctly', () => {
      const blok = createMockBlok({ label: 'Custom Label' });
      render(<Cta blok={blok} />);

      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('renders as Next.js Link for internal navigation', () => {
      const blok = createMockBlok({
        navigate_to: {
          cached_url: '/internal-page',
          linktype: 'story',
        },
      });
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/internal-page');
    });

    it('renders as anchor for external links', () => {
      const blok = createMockBlok({
        navigate_to: {
          url: 'https://example.com',
          linktype: 'url',
        },
      });
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });
  });

  // ============================================================================
  // Props Handling Tests
  // ============================================================================

  describe('Props Handling', () => {
    describe('CTA Types', () => {
      it('applies primary styles', () => {
        const blok = createMockBlok({ cta_type: 'primary' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        expect(link).toHaveClass('bg-primary-700', 'text-gray-50');
      });

      it('applies primary-reverse styles', () => {
        const blok = createMockBlok({ cta_type: 'primary-reverse' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        expect(link).toHaveClass('bg-primary-50', 'text-primary-700');
      });

      it('applies primary-outlined styles', () => {
        const blok = createMockBlok({ cta_type: 'primary-outlined' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        expect(link).toHaveClass('border-2', 'border-primary-700');
      });

      it('applies secondary styles', () => {
        const blok = createMockBlok({ cta_type: 'secondary' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        expect(link).toHaveClass('bg-secondary-700', 'text-gray-50');
      });

      it('applies secondary-reverse styles', () => {
        const blok = createMockBlok({ cta_type: 'secondary-reverse' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        expect(link).toHaveClass('bg-secondary-50', 'text-secondary-700');
      });

      it('applies secondary-outlined styles', () => {
        const blok = createMockBlok({ cta_type: 'secondary-outlined' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        expect(link).toHaveClass('border-2', 'border-secondary-700');
      });

      it('applies link styles and shows arrow icon', () => {
        const blok = createMockBlok({ cta_type: 'link' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        expect(link).toHaveClass('bg-transparent', 'text-primary-900');
        expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();
      });
    });

    describe('CTA Sizes', () => {
      it('applies hug size styles', () => {
        const blok = createMockBlok({ cta_size: 'hug' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        expect(link).toHaveClass('px-3', 'py-2');
      });

      it('applies large size styles', () => {
        const blok = createMockBlok({ cta_size: 'large' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        expect(link).toHaveClass('px-12', 'py-6');
      });

      it('applies full size styles', () => {
        const blok = createMockBlok({ cta_size: 'full' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        expect(link).toHaveClass('w-full', 'px-8', 'py-5');
      });
    });

    describe('Default Values', () => {
      it('uses primary as default cta_type', () => {
        const blok = createMockBlok({ cta_type: undefined });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        expect(link).toHaveClass('bg-primary-700');
      });

      it('uses hug as default cta_size', () => {
        const blok = createMockBlok({ cta_size: undefined });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        expect(link).toHaveClass('px-3', 'py-2');
      });
    });
  });

  // ============================================================================
  // Link Behavior Tests
  // ============================================================================

  describe('Link Behavior', () => {
    it('uses cached_url when available', () => {
      const blok = createMockBlok({
        navigate_to: {
          cached_url: '/cached-url',
          url: '/regular-url',
          linktype: 'story',
        },
      });
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/cached-url');
    });

    it('falls back to url when cached_url is not available', () => {
      const blok = createMockBlok({
        navigate_to: {
          url: '/regular-url',
          linktype: 'story',
        },
      });
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/regular-url');
    });

    it('falls back to # when no URL is provided', () => {
      const blok = createMockBlok({
        navigate_to: {
          linktype: 'story',
        },
      });
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#');
    });

    it('handles undefined navigate_to', () => {
      const blok = createMockBlok({
        navigate_to: undefined,
      });
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#');
    });

    it('sets target attribute correctly', () => {
      const blok = createMockBlok({
        navigate_to: {
          cached_url: 'https://example.com',
          linktype: 'url',
          target: '_blank',
        },
      });
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('adds rel="noopener noreferrer" for blank targets', () => {
      const blok = createMockBlok({
        navigate_to: {
          cached_url: 'https://example.com',
          linktype: 'url',
          target: '_blank',
        },
      });
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('treats URLs starting with http as external', () => {
      const blok = createMockBlok({
        navigate_to: {
          cached_url: 'https://external-site.com',
          linktype: 'story', // Even if linktype is story, http URLs are external
        },
      });
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');
      expect(link.tagName).toBe('A');
    });
  });

  // ============================================================================
  // Conditional Rendering Tests
  // ============================================================================

  describe('Conditional Rendering', () => {
    it('shows arrow icon only for link type', () => {
      const blok = createMockBlok({ cta_type: 'link' });
      render(<Cta blok={blok} />);

      expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();
    });

    it('does not show arrow icon for primary type', () => {
      const blok = createMockBlok({ cta_type: 'primary' });
      render(<Cta blok={blok} />);

      expect(screen.queryByTestId('arrow-right-icon')).not.toBeInTheDocument();
    });

    it('does not show arrow icon for secondary type', () => {
      const blok = createMockBlok({ cta_type: 'secondary' });
      render(<Cta blok={blok} />);

      expect(screen.queryByTestId('arrow-right-icon')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Style Tests
  // ============================================================================

  describe('Styles', () => {
    it('applies base styles to all CTAs', () => {
      const blok = createMockBlok();
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass(
        'box-border',
        'flex',
        'items-center',
        'justify-center',
        'font-semibold',
        'rounded-xl'
      );
    });

    it('applies transition styles', () => {
      const blok = createMockBlok();
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('transition-all', 'duration-200');
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('is accessible via link role', () => {
      const blok = createMockBlok();
      render(<Cta blok={blok} />);

      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('has accessible text content', () => {
      const blok = createMockBlok({ label: 'Learn More' });
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link', { name: /learn more/i });
      expect(link).toBeInTheDocument();
    });

    it('wraps label text in span with whitespace-nowrap', () => {
      const blok = createMockBlok({ label: 'Test Label' });
      const { container } = render(<Cta blok={blok} />);

      const span = container.querySelector('span');
      expect(span).toHaveClass('whitespace-nowrap');
      expect(span).toHaveTextContent('Test Label');
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Cta from '@/components/atoms/Cta';
import type { CtaBlok } from '@/types/storyblok';

// Mock react-icons/hi2
vi.mock('react-icons/hi2', () => ({
  HiArrowRight: ({ className }: { className?: string }) => (
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
      it('applies primary styles with wrapper/text separation', () => {
        const blok = createMockBlok({ cta_type: 'primary' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        const textSpan = link.querySelector('span.cta-text');

        // Wrapper styles
        expect(link).toHaveClass('group', 'rounded-2xl', 'bg-primary-700');
        expect(link.className).toContain('hover:bg-primary-50');
        expect(link.className).toContain('hover:border-transparent');

        // Text gradient styles
        expect(textSpan).toHaveClass('text-transparent', 'bg-clip-text');
        expect(textSpan).toHaveClass('from-primary-50', 'to-primary-50');
        expect(textSpan!.className).toContain('group-hover:from-primary-700');
        expect(textSpan!.className).toContain('group-hover:to-secondary-900');

        // Verify nested structure
        const labelSpan = textSpan?.querySelector('span.whitespace-nowrap');
        expect(labelSpan).toBeInTheDocument();
        expect(labelSpan).toHaveTextContent('Click me');
      });

      it('applies primary-reverse styles with wrapper/text separation', () => {
        const blok = createMockBlok({ cta_type: 'primary-reverse' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        const textSpan = link.querySelector('span.cta-text');

        // Wrapper styles
        expect(link).toHaveClass('group', 'rounded-2xl', 'bg-primary-50');
        expect(link.className).toContain('hover:bg-primary-50');
        expect(link.className).toContain('hover:border-transparent');

        // Text gradient styles
        expect(textSpan).toHaveClass('text-transparent', 'bg-clip-text');
        expect(textSpan).toHaveClass('from-primary-700', 'to-primary-700');
        expect(textSpan!.className).toContain('group-hover:from-primary-700');
        expect(textSpan!.className).toContain('group-hover:to-secondary-900');

        // Verify nested structure
        const labelSpan = textSpan?.querySelector('span.whitespace-nowrap');
        expect(labelSpan).toBeInTheDocument();
        expect(labelSpan).toHaveTextContent('Click me');
      });

      it('applies primary-outlined styles with wrapper/text separation', () => {
        const blok = createMockBlok({ cta_type: 'primary-outlined' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        const textSpan = link.querySelector('span.cta-text');

        // Wrapper styles
        expect(link).toHaveClass('group', 'rounded-2xl', 'bg-transparent');
        expect(link).toHaveClass('border-2', 'border-primary-400');
        expect(link.className).toContain('hover:bg-primary-50');
        expect(link.className).toContain('hover:border-transparent');

        // Text gradient styles
        expect(textSpan).toHaveClass('text-transparent', 'bg-clip-text');
        expect(textSpan).toHaveClass('from-primary-400', 'to-primary-400');
        expect(textSpan!.className).toContain('group-hover:from-primary-700');
        expect(textSpan!.className).toContain('group-hover:to-secondary-900');

        // Verify nested structure
        const labelSpan = textSpan?.querySelector('span.whitespace-nowrap');
        expect(labelSpan).toBeInTheDocument();
        expect(labelSpan).toHaveTextContent('Click me');
      });

      it('applies secondary styles with wrapper/text separation', () => {
        const blok = createMockBlok({ cta_type: 'secondary' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        const textSpan = link.querySelector('span.cta-text');

        // Wrapper styles
        expect(link).toHaveClass('group', 'rounded-2xl', 'bg-secondary-700');
        expect(link.className).toContain('hover:bg-secondary-50');
        expect(link.className).toContain('hover:border-transparent');

        // Text gradient styles
        expect(textSpan).toHaveClass('text-transparent', 'bg-clip-text');
        expect(textSpan).toHaveClass('from-secondary-50', 'to-secondary-50');
        expect(textSpan!.className).toContain('group-hover:from-secondary-700');
        expect(textSpan!.className).toContain('group-hover:to-secondary-900');

        // Verify nested structure
        const labelSpan = textSpan?.querySelector('span.whitespace-nowrap');
        expect(labelSpan).toBeInTheDocument();
        expect(labelSpan).toHaveTextContent('Click me');
      });

      it('applies secondary-reverse styles with wrapper/text separation', () => {
        const blok = createMockBlok({ cta_type: 'secondary-reverse' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        const textSpan = link.querySelector('span.cta-text');

        // Wrapper styles
        expect(link).toHaveClass('group', 'rounded-2xl', 'bg-secondary-50');
        expect(link.className).toContain('hover:bg-secondary-50');
        expect(link.className).toContain('hover:border-transparent');

        // Text gradient styles
        expect(textSpan).toHaveClass('text-transparent', 'bg-clip-text');
        expect(textSpan).toHaveClass('from-secondary-700', 'to-secondary-700');
        expect(textSpan!.className).toContain('group-hover:from-secondary-700');
        expect(textSpan!.className).toContain('group-hover:to-secondary-900');

        // Verify nested structure
        const labelSpan = textSpan?.querySelector('span.whitespace-nowrap');
        expect(labelSpan).toBeInTheDocument();
        expect(labelSpan).toHaveTextContent('Click me');
      });

      it('applies secondary-outlined styles with wrapper/text separation', () => {
        const blok = createMockBlok({ cta_type: 'secondary-outlined' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        const textSpan = link.querySelector('span.cta-text');

        // Wrapper styles
        expect(link).toHaveClass('group', 'rounded-2xl', 'bg-transparent');
        expect(link).toHaveClass('border-2', 'border-secondary-400');
        expect(link.className).toContain('hover:bg-secondary-50');
        expect(link.className).toContain('hover:border-transparent');

        // Text gradient styles
        expect(textSpan).toHaveClass('text-transparent', 'bg-clip-text');
        expect(textSpan).toHaveClass('from-secondary-400', 'to-secondary-400');
        expect(textSpan!.className).toContain('group-hover:from-secondary-700');
        expect(textSpan!.className).toContain('group-hover:to-secondary-900');

        // Verify nested structure
        const labelSpan = textSpan?.querySelector('span.whitespace-nowrap');
        expect(labelSpan).toBeInTheDocument();
        expect(labelSpan).toHaveTextContent('Click me');
      });

      it('applies link styles with wrapper/text separation and shows arrow icon', () => {
        const blok = createMockBlok({ cta_type: 'link' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        const textSpan = link.querySelector('span.cta-text');

        // Wrapper styles
        expect(link).toHaveClass('group', 'rounded-2xl', 'bg-transparent');
        expect(link).toHaveClass('no-underline', 'hover:underline', 'hover:decoration-primary-700', 'p-0');

        // Text gradient styles (no group-hover for link type)
        expect(textSpan).toHaveClass('text-transparent', 'bg-clip-text');
        expect(textSpan).toHaveClass('from-primary-700', 'to-primary-900');
        expect(textSpan).toHaveClass('pointer', 'px-0', 'py-0');

        // Verify arrow icon and its class
        const arrowIcon = screen.getByTestId('arrow-right-icon');
        expect(arrowIcon).toBeInTheDocument();
        expect(arrowIcon).toHaveClass('size-5', 'text-primary-900');

        // Verify nested structure
        const labelSpan = textSpan?.querySelector('span.whitespace-nowrap');
        expect(labelSpan).toBeInTheDocument();
        expect(labelSpan).toHaveTextContent('Click me');
      });
    });

    describe('CTA Sizes', () => {
      it('applies hug size styles', () => {
        const blok = createMockBlok({ cta_size: 'hug' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        const textSpan = link.querySelector('span.cta-text');

        // Size is now applied to text span, not wrapper
        expect(textSpan).toHaveClass('px-4', 'py-3');
        expect(link).not.toHaveClass('px-4', 'py-3');
      });

      it('applies large size styles', () => {
        const blok = createMockBlok({ cta_size: 'large' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        const textSpan = link.querySelector('span.cta-text');

        // Size is now applied to text span, not wrapper
        expect(textSpan).toHaveClass('px-12', 'py-6');
        expect(link).not.toHaveClass('px-12', 'py-6');
      });

      it('applies full size styles', () => {
        const blok = createMockBlok({ cta_size: 'full' });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        const textSpan = link.querySelector('span.cta-text');

        // Size is now applied to text span, not wrapper
        expect(textSpan).toHaveClass('w-full', 'px-8', 'py-5');
        expect(link).not.toHaveClass('w-full', 'px-8', 'py-5');
      });
    });

    describe('Default Values', () => {
      it('uses primary as default cta_type', () => {
        const blok = createMockBlok({ cta_type: undefined });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        const textSpan = link.querySelector('span.cta-text');

        // Verify default primary styles
        expect(link).toHaveClass('bg-primary-700');
        expect(textSpan).toHaveClass('text-transparent', 'bg-clip-text');
        expect(textSpan).toHaveClass('from-primary-50', 'to-primary-50');
      });

      it('uses hug as default cta_size', () => {
        const blok = createMockBlok({ cta_size: undefined });
        render(<Cta blok={blok} />);

        const link = screen.getByRole('link');
        const textSpan = link.querySelector('span.cta-text');

        // Size is now applied to text span
        expect(textSpan).toHaveClass('px-4', 'py-3');
        expect(link).not.toHaveClass('px-4', 'py-3');
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
    it('applies base wrapper and text styles to all CTAs', () => {
      const blok = createMockBlok();
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');
      const textSpan = link.querySelector('span.cta-text');

      // Wrapper base styles (cn() with tailwind-merge optimizes class order)
      expect(link).toHaveClass(
        'group',
        'rounded-2xl',
        'duration-300',
        'transition-opacity'
      );

      // Text span base styles
      expect(textSpan).toHaveClass(
        'box-border',
        'flex',
        'gap-2',
        'items-center',
        'justify-center',
        'font-semibold',
        'rounded-2xl',
        'tracking-wide',
        'text-transparent',
        'bg-clip-text'
      );
    });

    it('applies transition styles with correct duration', () => {
      const blok = createMockBlok();
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');
      const textSpan = link.querySelector('span.cta-text');

      // Both wrapper and text have transition classes (cn() optimizes with tailwind-merge)
      expect(link).toHaveClass('duration-300', 'transition-opacity');
      expect(textSpan).toHaveClass('duration-300', 'transition-opacity');
    });

    it('applies group class for hover pattern', () => {
      const blok = createMockBlok();
      render(<Cta blok={blok} />);

      const link = screen.getByRole('link');

      // Verify group class present for all CTAs
      expect(link).toHaveClass('group');
    });
  });

  // ============================================================================
  // Gradient Text Effects Tests
  // ============================================================================

  describe('Gradient Text Effects', () => {
    it('applies text-transparent and bg-clip-text to all non-link types', () => {
      const types = ['primary', 'primary-reverse', 'primary-outlined', 'secondary', 'secondary-reverse', 'secondary-outlined'];

      types.forEach(type => {
        const { container } = render(<Cta blok={createMockBlok({ cta_type: type as CtaBlok['cta_type'] })} />);
        const textSpan = container.querySelector('span.cta-text');

        expect(textSpan).toHaveClass('text-transparent', 'bg-clip-text');
      });
    });

    it('applies correct gradient colors for primary variant', () => {
      render(<Cta blok={createMockBlok({ cta_type: 'primary' })} />);
      const textSpan = screen.getByRole('link').querySelector('span.cta-text');

      expect(textSpan).toHaveClass('from-primary-50', 'to-primary-50');
      expect(textSpan!.className).toContain('group-hover:from-primary-700');
      expect(textSpan!.className).toContain('group-hover:to-secondary-900');
    });

    it('applies correct gradient colors for secondary variants', () => {
      const { container } = render(<Cta blok={createMockBlok({ cta_type: 'secondary' })} />);
      const textSpan = container.querySelector('span.cta-text');

      expect(textSpan).toHaveClass('from-secondary-50', 'to-secondary-50');
      expect(textSpan!.className).toContain('group-hover:from-secondary-700');
      expect(textSpan!.className).toContain('group-hover:to-secondary-900');
    });

    it('applies link variant gradient without group-hover classes', () => {
      const { container } = render(<Cta blok={createMockBlok({ cta_type: 'link' })} />);
      const textSpan = container.querySelector('span.cta-text');

      expect(textSpan).toHaveClass('text-transparent', 'bg-clip-text');
      expect(textSpan).toHaveClass('from-primary-700', 'to-primary-900');
      expect(textSpan!.className).not.toContain('group-hover:from-');
      expect(textSpan!.className).not.toContain('group-hover:to-');
    });

    it('verifies cta-text class present on all variants', () => {
      const types = ['primary', 'primary-reverse', 'primary-outlined', 'secondary', 'secondary-reverse', 'secondary-outlined', 'link'];

      types.forEach(type => {
        const { container } = render(<Cta blok={createMockBlok({ cta_type: type as CtaBlok['cta_type'] })} />);
        const textSpan = container.querySelector('span.cta-text');

        expect(textSpan).toBeInTheDocument();
        expect(textSpan).toHaveClass('cta-text');
      });
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

    it('wraps label text in nested span structure with whitespace-nowrap', () => {
      const blok = createMockBlok({ label: 'Test Label' });
      const { container } = render(<Cta blok={blok} />);

      const textSpan = container.querySelector('span.cta-text');
      const labelSpan = textSpan?.querySelector('span.whitespace-nowrap');

      expect(textSpan).toBeInTheDocument();
      expect(labelSpan).toBeInTheDocument();
      expect(labelSpan).toHaveClass('whitespace-nowrap');
      expect(labelSpan).toHaveTextContent('Test Label');
    });
  });
});

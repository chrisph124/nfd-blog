import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/organisms/Footer';
import type { FooterBlok } from '@/types/storyblok';

vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: vi.fn(() => ({ 'data-testid': 'storyblok-editable' })),
}));

const createMockBlok = (overrides: Partial<FooterBlok> = {}): FooterBlok => ({
  _uid: 'test-uid',
  component: 'footer',
  copyright: '© 2025 Test. All rights reserved.',
  footer_links: [],
  social_media: [],
  ...overrides,
});

describe('Footer', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('renders copyright text', () => {
      const blok = createMockBlok({ copyright: '© 2025 Custom Copyright' });
      render(<Footer blok={blok} />);

      expect(screen.getByText('© 2025 Custom Copyright')).toBeInTheDocument();
    });

    it('renders with storyblok editable attributes', () => {
      const blok = createMockBlok();
      const { container } = render(<Footer blok={blok} />);

      const footer = container.querySelector('[data-testid="storyblok-editable"]');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('handles undefined copyright', () => {
      const blok = createMockBlok({ copyright: undefined });
      const { container } = render(<Footer blok={blok} />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
    });

    it('handles empty copyright', () => {
      const blok = createMockBlok({ copyright: '' });
      const { container } = render(<Footer blok={blok} />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toBeEmptyDOMElement();
    });
  });

  describe('Styles', () => {
    it('has correct background and text colors', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('bg-gray-800', 'text-white');
    });

    it('has full width', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('w-full');
    });

    it('has centered text', () => {
      const blok = createMockBlok();
      const { container } = render(<Footer blok={blok} />);

      const innerDiv = container.querySelector('.text-center');
      expect(innerDiv).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic footer element', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });
});

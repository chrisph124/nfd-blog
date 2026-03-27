import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Teaser from '@/components/molecules/Teaser';
import type { TeaserBlok } from '@/types/storyblok';

const createMockBlok = (overrides: Partial<TeaserBlok> = {}): TeaserBlok => ({
  _uid: 'test-uid',
  component: 'teaser',
  headline: 'Test Headline',
  ...overrides,
});

describe('Teaser', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      render(<Teaser blok={blok} />);

      expect(screen.getByText('Test Headline')).toBeInTheDocument();
    });

    it('renders headline as h2', () => {
      const blok = createMockBlok({ headline: 'Custom Headline' });
      render(<Teaser blok={blok} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Custom Headline');
    });

    it('renders with correct container classes', () => {
      const blok = createMockBlok();
      const { container } = render(<Teaser blok={blok} />);

      const teaserDiv = container.querySelector('.teaser');
      expect(teaserDiv).toBeInTheDocument();
      expect(teaserDiv).toHaveClass('w-full');
    });
  });

  describe('Props Handling', () => {
    it('handles undefined headline', () => {
      const blok = createMockBlok({ headline: undefined });
      const { container } = render(<Teaser blok={blok} />);

      const h2 = container.querySelector('h2');
      expect(h2).toBeInTheDocument();
      expect(h2).toBeEmptyDOMElement();
    });

    it('handles empty headline', () => {
      const blok = createMockBlok({ headline: '' });
      const { container } = render(<Teaser blok={blok} />);

      const h2 = container.querySelector('h2');
      expect(h2).toBeInTheDocument();
      expect(h2).toHaveTextContent('');
    });

    it('renders long headlines correctly', () => {
      const longHeadline = 'This is a very long headline that should still render correctly';
      const blok = createMockBlok({ headline: longHeadline });
      render(<Teaser blok={blok} />);

      expect(screen.getByText(longHeadline)).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('has responsive padding classes', () => {
      const blok = createMockBlok();
      const { container } = render(<Teaser blok={blok} />);

      const innerDiv = container.querySelector(String.raw`.max-w-\[1280px\]`);
      expect(innerDiv).toBeInTheDocument();
      expect(innerDiv).toHaveClass('px-6', 'md:px-10', 'lg:px-15', 'xl:px-5');
    });

    it('has centered content with margin', () => {
      const blok = createMockBlok();
      const { container } = render(<Teaser blok={blok} />);

      const innerDiv = container.querySelector(String.raw`.max-w-\[1280px\]`);
      expect(innerDiv).toHaveClass('mx-auto', 'my-6');
    });
  });

  describe('Accessibility', () => {
    it('uses semantic heading element', () => {
      const blok = createMockBlok();
      render(<Teaser blok={blok} />);

      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
    });
  });
});

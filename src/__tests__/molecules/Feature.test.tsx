import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Feature from '@/components/molecules/Feature';
import type { FeatureBlok } from '@/types/storyblok';

const createMockBlok = (overrides: Partial<FeatureBlok> = {}): FeatureBlok => ({
  _uid: 'test-uid',
  component: 'feature',
  name: 'Test Feature',
  ...overrides,
});

describe('Feature', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      render(<Feature blok={blok} />);

      expect(screen.getByText('Test Feature')).toBeInTheDocument();
    });

    it('renders the feature name', () => {
      const blok = createMockBlok({ name: 'Custom Feature Name' });
      render(<Feature blok={blok} />);

      expect(screen.getByText('Custom Feature Name')).toBeInTheDocument();
    });

    it('renders with correct container classes', () => {
      const blok = createMockBlok();
      const { container } = render(<Feature blok={blok} />);

      const featureDiv = container.querySelector('.feature');
      expect(featureDiv).toBeInTheDocument();
      expect(featureDiv).toHaveClass('w-full');
    });
  });

  describe('Props Handling', () => {
    it('handles undefined name', () => {
      const blok = createMockBlok({ name: undefined });
      const { container } = render(<Feature blok={blok} />);

      const span = container.querySelector('span');
      expect(span).toBeInTheDocument();
      expect(span).toBeEmptyDOMElement();
    });

    it('handles empty name', () => {
      const blok = createMockBlok({ name: '' });
      const { container } = render(<Feature blok={blok} />);

      const span = container.querySelector('span');
      expect(span).toBeInTheDocument();
      expect(span).toHaveTextContent('');
    });
  });

  describe('Layout', () => {
    it('has responsive padding classes', () => {
      const blok = createMockBlok();
      const { container } = render(<Feature blok={blok} />);

      const innerDiv = container.querySelector(String.raw`.max-w-\[1280px\]`);
      expect(innerDiv).toBeInTheDocument();
      expect(innerDiv).toHaveClass('px-6', 'md:px-10', 'lg:px-15', 'xl:px-5');
    });

    it('has centered content with margin', () => {
      const blok = createMockBlok();
      const { container } = render(<Feature blok={blok} />);

      const innerDiv = container.querySelector(String.raw`.max-w-\[1280px\]`);
      expect(innerDiv).toHaveClass('mx-auto', 'my-6');
    });
  });
});

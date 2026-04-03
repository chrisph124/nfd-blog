import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Grid from '@/components/organisms/Grid';
import type { GridBlok, StoryblokBlok } from '@/types/storyblok';

vi.mock('@storyblok/react/rsc', () => ({
  StoryblokServerComponent: ({ blok }: { blok: StoryblokBlok }) => (
    <div data-testid={`nested-component-${blok._uid}`}>{blok.component}</div>
  ),
}));

const createMockBlok = (overrides: Partial<GridBlok> = {}): GridBlok => ({
  _uid: 'test-uid',
  component: 'grid',
  columns: [],
  ...overrides,
});

const createMockNestedBlok = (uid: string, component: string): StoryblokBlok => ({
  _uid: uid,
  component,
});

describe('Grid', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      const { container } = render(<Grid blok={blok} />);

      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('renders with correct container classes', () => {
      const blok = createMockBlok();
      const { container } = render(<Grid blok={blok} />);

      const gridDiv = container.querySelector('.grid');
      expect(gridDiv).toHaveClass('w-full');
    });
  });

  describe('Nested Content', () => {
    it('renders nested column components', () => {
      const blok = createMockBlok({
        columns: [
          createMockNestedBlok('col-1', 'feature'),
          createMockNestedBlok('col-2', 'teaser'),
        ],
      });
      const { getByTestId } = render(<Grid blok={blok} />);

      expect(getByTestId('nested-component-col-1')).toBeInTheDocument();
      expect(getByTestId('nested-component-col-2')).toBeInTheDocument();
    });

    it('renders correct number of columns', () => {
      const blok = createMockBlok({
        columns: [
          createMockNestedBlok('col-1', 'feature'),
          createMockNestedBlok('col-2', 'teaser'),
          createMockNestedBlok('col-3', 'feature'),
        ],
      });
      const { container } = render(<Grid blok={blok} />);

      const nestedComponents = container.querySelectorAll('[data-testid^="nested-component-"]');
      expect(nestedComponents).toHaveLength(3);
    });

    it('handles empty columns array', () => {
      const blok = createMockBlok({ columns: [] });
      const { container } = render(<Grid blok={blok} />);

      const nestedComponents = container.querySelectorAll('[data-testid^="nested-component-"]');
      expect(nestedComponents).toHaveLength(0);
    });

    it('handles undefined columns', () => {
      const blok = createMockBlok({ columns: undefined });
      const { container } = render(<Grid blok={blok} />);

      expect(container.querySelector('.grid')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('has responsive padding classes', () => {
      const blok = createMockBlok();
      const { container } = render(<Grid blok={blok} />);

      const innerDiv = container.querySelector(String.raw`.max-w-\[1280px\]`);
      expect(innerDiv).toBeInTheDocument();
      expect(innerDiv).toHaveClass('px-4', 'md:px-8', 'lg:px-12', 'xl:px-5');
    });

    it('has centered content', () => {
      const blok = createMockBlok();
      const { container } = render(<Grid blok={blok} />);

      const innerDiv = container.querySelector(String.raw`.max-w-\[1280px\]`);
      expect(innerDiv).toHaveClass('mx-auto');
    });
  });
});

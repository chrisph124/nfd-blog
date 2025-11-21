import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import TabItem from '@/components/molecules/TabItem';
import type { TabItemBlok, StoryblokBlok } from '@/types/storyblok';

// Mock Storyblok components
vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: vi.fn(() => ({ 'data-testid': 'storyblok-editable' })),
  StoryblokServerComponent: ({ blok }: { blok: StoryblokBlok }) => (
    <div data-testid={`nested-component-${blok._uid}`}>{blok.component}</div>
  ),
}));

const createMockBlok = (overrides: Partial<TabItemBlok> = {}): TabItemBlok => ({
  _uid: 'test-uid',
  component: 'tab_item',
  label: 'Test Tab',
  content: [],
  ...overrides,
});

const createMockNestedBlok = (uid: string, component: string): StoryblokBlok => ({
  _uid: uid,
  component,
});

describe('TabItem', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      const { container } = render(<TabItem blok={blok} />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with storyblok editable attributes', () => {
      const blok = createMockBlok();
      const { container } = render(<TabItem blok={blok} />);

      const editableDiv = container.querySelector('[data-testid="storyblok-editable"]');
      expect(editableDiv).toBeInTheDocument();
    });

    it('has full width class', () => {
      const blok = createMockBlok();
      const { container } = render(<TabItem blok={blok} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('w-full');
    });
  });

  describe('Nested Content', () => {
    it('renders nested content components', () => {
      const blok = createMockBlok({
        content: [
          createMockNestedBlok('nested-1', 'feature'),
          createMockNestedBlok('nested-2', 'teaser'),
        ],
      });
      const { getByTestId } = render(<TabItem blok={blok} />);

      expect(getByTestId('nested-component-nested-1')).toBeInTheDocument();
      expect(getByTestId('nested-component-nested-2')).toBeInTheDocument();
    });

    it('renders correct number of nested components', () => {
      const blok = createMockBlok({
        content: [
          createMockNestedBlok('nested-1', 'feature'),
          createMockNestedBlok('nested-2', 'teaser'),
          createMockNestedBlok('nested-3', 'grid'),
        ],
      });
      const { container } = render(<TabItem blok={blok} />);

      const nestedComponents = container.querySelectorAll('[data-testid^="nested-component-"]');
      expect(nestedComponents).toHaveLength(3);
    });

    it('handles empty content array', () => {
      const blok = createMockBlok({ content: [] });
      const { container } = render(<TabItem blok={blok} />);

      const nestedComponents = container.querySelectorAll('[data-testid^="nested-component-"]');
      expect(nestedComponents).toHaveLength(0);
    });

    it('handles undefined content', () => {
      const blok = createMockBlok({ content: undefined });
      const { container } = render(<TabItem blok={blok} />);

      expect(container.firstChild).toBeInTheDocument();
      const nestedComponents = container.querySelectorAll('[data-testid^="nested-component-"]');
      expect(nestedComponents).toHaveLength(0);
    });
  });

  describe('Props Handling', () => {
    it('passes correct key to nested components', () => {
      const blok = createMockBlok({
        content: [createMockNestedBlok('unique-uid-123', 'feature')],
      });
      const { getByTestId } = render(<TabItem blok={blok} />);

      expect(getByTestId('nested-component-unique-uid-123')).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Page from '@/components/templates/Page';
import type { PageBlok, StoryblokBlok } from '@/types/storyblok';

vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: vi.fn(() => ({ 'data-testid': 'storyblok-editable' })),
  StoryblokServerComponent: ({ blok }: { blok: StoryblokBlok }) => (
    <div data-testid={`component-${blok._uid}`}>{blok.component}</div>
  ),
}));

const createMockBlok = (overrides: Partial<PageBlok> = {}): PageBlok => ({
  _uid: 'test-uid',
  component: 'page',
  body: [],
  ...overrides,
});

const createMockNestedBlok = (uid: string, component: string): StoryblokBlok => ({
  _uid: uid,
  component,
});

describe('Page', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      const { container } = render(<Page blok={blok} />);

      expect(container.querySelector('main')).toBeInTheDocument();
    });

    it('renders as main element', () => {
      const blok = createMockBlok();
      const { container } = render(<Page blok={blok} />);

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('renders with storyblok editable attributes', () => {
      const blok = createMockBlok();
      const { container } = render(<Page blok={blok} />);

      expect(container.querySelector('[data-testid="storyblok-editable"]')).toBeInTheDocument();
    });
  });

  describe('Body Content', () => {
    it('renders body components', () => {
      const blok = createMockBlok({
        body: [
          createMockNestedBlok('body-1', 'header'),
          createMockNestedBlok('body-2', 'hero_block'),
          createMockNestedBlok('body-3', 'footer'),
        ] as PageBlok['body'],
      });
      const { getByTestId } = render(<Page blok={blok} />);

      expect(getByTestId('component-body-1')).toBeInTheDocument();
      expect(getByTestId('component-body-2')).toBeInTheDocument();
      expect(getByTestId('component-body-3')).toBeInTheDocument();
    });

    it('renders correct number of body components', () => {
      const blok = createMockBlok({
        body: [
          createMockNestedBlok('body-1', 'header'),
          createMockNestedBlok('body-2', 'hero_block'),
        ] as PageBlok['body'],
      });
      const { container } = render(<Page blok={blok} />);

      const components = container.querySelectorAll('[data-testid^="component-"]');
      expect(components).toHaveLength(2);
    });

    it('handles empty body array', () => {
      const blok = createMockBlok({ body: [] });
      const { container } = render(<Page blok={blok} />);

      const components = container.querySelectorAll('[data-testid^="component-"]');
      expect(components).toHaveLength(0);
    });

    it('handles undefined body', () => {
      const blok = createMockBlok({ body: undefined });
      const { container } = render(<Page blok={blok} />);

      expect(container.querySelector('main')).toBeInTheDocument();
    });
  });

  describe('Component Keys', () => {
    it('uses _uid as key for body components', () => {
      const blok = createMockBlok({
        body: [createMockNestedBlok('unique-uid-123', 'feature')] as PageBlok['body'],
      });
      const { getByTestId } = render(<Page blok={blok} />);

      expect(getByTestId('component-unique-uid-123')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic main element', () => {
      const blok = createMockBlok();
      const { container } = render(<Page blok={blok} />);

      expect(container.querySelector('main')).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ContentCards from '@/components/organisms/ContentCards';
import type { ContentCardsBlok, ContentCardBlockBlok } from '@/types/storyblok';

// Mock @/lib/storyblok-utils
vi.mock('@/lib/storyblok-utils', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    StoryblokServerComponent: ({ blok }: { blok: { _uid: string; component: string } }) => (
      <div data-testid={`nested-component-${blok._uid}`}>{blok.component}</div>
    ),
    makeStoryblokEditable: vi.fn(() => ({})),
  };
});

const createMockBlok = (overrides: Partial<ContentCardsBlok> = {}): ContentCardsBlok => ({
  _uid: 'test-uid',
  component: 'content_cards',
  blocks: [],
  ...overrides,
});

const createMockContentCardBlock = (uid: string): ContentCardBlockBlok => ({
  _uid: uid,
  component: 'content_card_block',
  variant: 'primary',
});

describe('ContentCards', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      const { container } = render(<ContentCards blok={blok} />);

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('renders as section element', () => {
      const blok = createMockBlok();
      const { container } = render(<ContentCards blok={blok} />);

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('applies makeStoryblokEditable props', async () => {
      const { makeStoryblokEditable } = await import('@/lib/storyblok-utils');
      const blok = createMockBlok();
      render(<ContentCards blok={blok} />);

      expect(makeStoryblokEditable).toHaveBeenCalledWith(blok);
    });
  });

  describe('Block Rendering', () => {
    it('renders two blocks in grid', () => {
      const blok = createMockBlok({
        blocks: [
          createMockContentCardBlock('block-1'),
          createMockContentCardBlock('block-2'),
        ],
      });
      const { getByTestId } = render(<ContentCards blok={blok} />);

      expect(getByTestId('nested-component-block-1')).toBeInTheDocument();
      expect(getByTestId('nested-component-block-2')).toBeInTheDocument();
    });

    it('renders correct number of children', () => {
      const blok = createMockBlok({
        blocks: [
          createMockContentCardBlock('block-1'),
          createMockContentCardBlock('block-2'),
          createMockContentCardBlock('block-3'),
        ],
      });
      const { container } = render(<ContentCards blok={blok} />);

      const nestedComponents = container.querySelectorAll('[data-testid^="nested-component-"]');
      expect(nestedComponents).toHaveLength(3);
    });

    it('handles single block correctly', () => {
      const blok = createMockBlok({
        blocks: [createMockContentCardBlock('block-1')],
      });
      const { container } = render(<ContentCards blok={blok} />);

      const nestedComponents = container.querySelectorAll('[data-testid^="nested-component-"]');
      expect(nestedComponents).toHaveLength(1);
    });

    it('handles empty blocks array', () => {
      const blok = createMockBlok({ blocks: [] });
      const { container } = render(<ContentCards blok={blok} />);

      expect(container.querySelector('section')).toBeInTheDocument();
      const nestedComponents = container.querySelectorAll('[data-testid^="nested-component-"]');
      expect(nestedComponents).toHaveLength(0);
    });

    it('handles undefined blocks', () => {
      const blok = createMockBlok({ blocks: undefined });
      const { container } = render(<ContentCards blok={blok} />);

      expect(container.querySelector('section')).toBeInTheDocument();
      const nestedComponents = container.querySelectorAll('[data-testid^="nested-component-"]');
      expect(nestedComponents).toHaveLength(0);
    });
  });

  describe('Grid Layout Classes', () => {
    it('applies base grid classes', () => {
      const blok = createMockBlok();
      const { container } = render(<ContentCards blok={blok} />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('grid', 'gap-4', 'md:gap-6');
    });

    it('applies grid-cols-1 for single block', () => {
      const blok = createMockBlok({
        blocks: [createMockContentCardBlock('block-1')],
      });
      const { container } = render(<ContentCards blok={blok} />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('grid-cols-1');
    });

    it('applies grid-cols-1 md:grid-cols-2 for two blocks with default layout', () => {
      const blok = createMockBlok({
        blocks: [
          createMockContentCardBlock('block-1'),
          createMockContentCardBlock('block-2'),
        ],
      });
      const { container } = render(<ContentCards blok={blok} />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    describe('Layout Variants', () => {
      it('applies xl:grid-cols-2 for 5/5 layout (default)', () => {
        const blok = createMockBlok({
          blocks: [
            createMockContentCardBlock('block-1'),
            createMockContentCardBlock('block-2'),
          ],
          layout: '5/5',
        });
        const { container } = render(<ContentCards blok={blok} />);

        const section = container.querySelector('section');
        expect(section).toHaveClass('xl:grid-cols-2');
      });

      it('applies xl:grid-cols-[6fr_4fr] for 6/4 layout', () => {
        const blok = createMockBlok({
          blocks: [
            createMockContentCardBlock('block-1'),
            createMockContentCardBlock('block-2'),
          ],
          layout: '6/4',
        });
        const { container } = render(<ContentCards blok={blok} />);

        const section = container.querySelector('section');
        expect(section).toHaveClass('xl:grid-cols-[6fr_4fr]');
      });

      it('applies xl:grid-cols-[4fr_6fr] for 4/6 layout', () => {
        const blok = createMockBlok({
          blocks: [
            createMockContentCardBlock('block-1'),
            createMockContentCardBlock('block-2'),
          ],
          layout: '4/6',
        });
        const { container } = render(<ContentCards blok={blok} />);

        const section = container.querySelector('section');
        expect(section).toHaveClass('xl:grid-cols-[4fr_6fr]');
      });

      it('defaults to 5/5 layout when layout is undefined', () => {
        const blok = createMockBlok({
          blocks: [
            createMockContentCardBlock('block-1'),
            createMockContentCardBlock('block-2'),
          ],
          layout: undefined,
        });
        const { container } = render(<ContentCards blok={blok} />);

        const section = container.querySelector('section');
        expect(section).toHaveClass('xl:grid-cols-2');
      });
    });

    describe('Single Block Layout', () => {
      it('does not apply xl layout classes for single block', () => {
        const blok = createMockBlok({
          blocks: [createMockContentCardBlock('block-1')],
          layout: '6/4',
        });
        const { container } = render(<ContentCards blok={blok} />);

        const section = container.querySelector('section');
        expect(section).not.toHaveClass('xl:grid-cols-[6fr_4fr]');
      });

      it('always applies grid-cols-1 for single block regardless of layout prop', () => {
        const blok = createMockBlok({
          blocks: [createMockContentCardBlock('block-1')],
          layout: '4/6',
        });
        const { container } = render(<ContentCards blok={blok} />);

        const section = container.querySelector('section');
        expect(section).toHaveClass('grid-cols-1');
        expect(section).not.toHaveClass('xl:grid-cols-[4fr_6fr]');
      });
    });
  });

  describe('Empty State', () => {
    it('renders section without children when blocks is empty', () => {
      const blok = createMockBlok({ blocks: [] });
      const { container } = render(<ContentCards blok={blok} />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section?.children).toHaveLength(0);
    });

    it('renders section without children when blocks is undefined', () => {
      const blok = createMockBlok({ blocks: undefined });
      const { container } = render(<ContentCards blok={blok} />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section?.children).toHaveLength(0);
    });
  });
});

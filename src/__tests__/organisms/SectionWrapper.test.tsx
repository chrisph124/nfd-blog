import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SectionWrapper from '@/components/organisms/SectionWrapper';
import type { SectionWrapperBlok, StoryblokBlok, CtaBlok } from '@/types/storyblok';

vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: vi.fn(() => ({ 'data-testid': 'storyblok-editable' })),
  StoryblokServerComponent: ({ blok }: { blok: StoryblokBlok }) => (
    <div data-testid={`nested-${blok._uid}`}>{blok.component}</div>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <div
      data-testid="next-image"
      data-src={src}
      data-alt={alt}
      role="img"
      aria-label={alt}
    />
  ),
}));

const createMockCta = (uid: string): CtaBlok => ({
  _uid: uid,
  component: 'cta',
  label: 'CTA',
});

const createMockBlok = (overrides: Partial<SectionWrapperBlok> = {}): SectionWrapperBlok => ({
  _uid: 'test-uid',
  component: 'section_wrapper',
  heading: 'Test Section',
  navigate_to: [],
  childrens: [],
  ...overrides,
});

describe('SectionWrapper', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      render(<SectionWrapper blok={blok} />);

      expect(screen.getByText('Test Section')).toBeInTheDocument();
    });

    it('renders as section element', () => {
      const blok = createMockBlok();
      const { container } = render(<SectionWrapper blok={blok} />);

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('renders with storyblok editable attributes', () => {
      const blok = createMockBlok();
      const { container } = render(<SectionWrapper blok={blok} />);

      expect(container.querySelector('[data-testid="storyblok-editable"]')).toBeInTheDocument();
    });
  });

  describe('Section Header', () => {
    it('renders heading when provided', () => {
      const blok = createMockBlok({ heading: 'Custom Heading' });
      render(<SectionWrapper blok={blok} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Custom Heading');
    });

    it('does not render heading when not provided', () => {
      const blok = createMockBlok({ heading: undefined });
      render(<SectionWrapper blok={blok} />);

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('renders CTA buttons in header', () => {
      const blok = createMockBlok({
        navigate_to: [createMockCta('cta-1'), createMockCta('cta-2')],
      });
      const { getByTestId } = render(<SectionWrapper blok={blok} />);

      expect(getByTestId('nested-cta-1')).toBeInTheDocument();
      expect(getByTestId('nested-cta-2')).toBeInTheDocument();
    });

    it('does not render header when no heading and no CTAs', () => {
      const blok = createMockBlok({ heading: undefined, navigate_to: [] });
      render(<SectionWrapper blok={blok} />);

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('Children Content', () => {
    it('renders children components', () => {
      const blok = createMockBlok({
        childrens: [
          { _uid: 'child-1', component: 'feature' },
          { _uid: 'child-2', component: 'teaser' },
        ],
      });
      const { getByTestId } = render(<SectionWrapper blok={blok} />);

      expect(getByTestId('nested-child-1')).toBeInTheDocument();
      expect(getByTestId('nested-child-2')).toBeInTheDocument();
    });

    it('handles empty children array', () => {
      const blok = createMockBlok({ childrens: [] });
      const { container } = render(<SectionWrapper blok={blok} />);

      const nestedComponents = container.querySelectorAll('[data-testid^="nested-child-"]');
      expect(nestedComponents).toHaveLength(0);
    });

    it('handles undefined children', () => {
      const blok = createMockBlok({ childrens: undefined });
      const { container } = render(<SectionWrapper blok={blok} />);

      expect(container.querySelector('section')).toBeInTheDocument();
    });
  });

  describe('Background Pattern', () => {
    it('renders background image when provided', () => {
      const blok = createMockBlok({
        background_pattern: {
          id: 1,
          filename: '/pattern.svg',
          alt: 'Pattern',
        },
      });
      const { getByTestId } = render(<SectionWrapper blok={blok} />);

      expect(getByTestId('next-image')).toBeInTheDocument();
    });

    it('adds overflow-hidden class when background exists', () => {
      const blok = createMockBlok({
        background_pattern: {
          id: 1,
          filename: '/pattern.svg',
        },
      });
      const { container } = render(<SectionWrapper blok={blok} />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('overflow-hidden');
    });

    it('does not render background when not provided', () => {
      const blok = createMockBlok({ background_pattern: undefined });
      const { queryByTestId } = render(<SectionWrapper blok={blok} />);

      expect(queryByTestId('next-image')).not.toBeInTheDocument();
    });
  });

  describe('Styles', () => {
    it('has correct layout classes', () => {
      const blok = createMockBlok();
      const { container } = render(<SectionWrapper blok={blok} />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('relative', 'w-full', 'flex', 'flex-col');
    });

    it('has responsive padding', () => {
      const blok = createMockBlok();
      const { container } = render(<SectionWrapper blok={blok} />);

      // Section has base layout classes
      const section = container.querySelector('section');
      expect(section).toHaveClass('relative', 'w-full', 'flex', 'flex-col', 'gap-10', 'lg:gap-20', 'py-10', 'lg:py-12');

      // Inner div has responsive padding and max-width (z-10 content layer)
      const contentWrapper = container.querySelector('section > div:not(.absolute)');
      expect(contentWrapper).toHaveClass('w-full', 'max-w-[1280px]', 'relative', 'z-10', 'flex', 'flex-col', 'gap-10', 'lg:gap-14', 'items-center', 'px-4', 'md:px-8', 'lg:px-12', 'xl:px-5', 'mx-auto');
    });

    it('heading has correct typography', () => {
      const blok = createMockBlok({ heading: 'Test' });
      render(<SectionWrapper blok={blok} />);

      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('font-bold', 'text-primary-900');
    });
  });
});

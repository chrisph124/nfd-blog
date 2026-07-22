import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Comparison from '@/components/molecules/Comparison';
import type { ComparisonBlok, ComparisonCardBlok } from '@/types/storyblok';

// storyblokEditable only emits attrs inside the Visual Editor; renderRichText is
// stubbed to a deterministic HTML string (real richtext rendering is covered by
// the Richtext atom's own tests).
vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: vi.fn(() => ({ 'data-testid': 'sb-editable' })),
  renderRichText: vi.fn((doc: unknown) => (doc ? '<p>rich body</p>' : '')),
}));

let cardId = 0;
const makeCard = (overrides: Partial<ComparisonCardBlok> = {}): ComparisonCardBlok => ({
  _uid: `card-${cardId++}`,
  component: 'comparison_card',
  ...overrides,
});

const makeBlok = (overrides: Partial<ComparisonBlok> = {}): ComparisonBlok => ({
  _uid: 'cmp-1',
  component: 'comparison',
  ...overrides,
});

const root = (c: HTMLElement) => c.querySelector('[data-slot="comparison"]');
const cards = (c: HTMLElement) => c.querySelectorAll('[data-slot="comparison-card"]');

describe('Comparison (molecule blok wrapper)', () => {
  it('renders nothing when columns is undefined', () => {
    const { container } = render(<Comparison blok={makeBlok()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when columns is empty', () => {
    const { container } = render(<Comparison blok={makeBlok({ columns: [] })} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one card per column', () => {
    const { container } = render(
      <Comparison blok={makeBlok({ columns: [makeCard(), makeCard()] })} />
    );
    expect(cards(container)).toHaveLength(2);
    expect(root(container)).toBeInTheDocument();
  });

  it('renders a third card (grid wraps to a new row via CSS)', () => {
    const { container } = render(
      <Comparison blok={makeBlok({ columns: [makeCard(), makeCard(), makeCard()] })} />
    );
    expect(cards(container)).toHaveLength(3);
  });

  it.each([
    ['positive', ['border-emerald-500/40', 'bg-emerald-500/5', 'text-emerald-600', 'dark:text-emerald-400']],
    ['negative', ['border-red-500/40', 'bg-red-500/5', 'text-red-600', 'dark:text-red-400']],
    ['neutral', ['border-primary-500/40', 'bg-primary-500/5', 'text-primary-700', 'dark:text-primary-400']],
  ] as const)('applies the %s tone classes', (tone, classes) => {
    const { container } = render(
      <Comparison blok={makeBlok({ columns: [makeCard({ tone })] })} />
    );
    expect(cards(container)[0]).toHaveClass(...classes);
  });

  it('defaults an unset tone to neutral', () => {
    const { container } = render(
      <Comparison blok={makeBlok({ columns: [makeCard()] })} />
    );
    expect(cards(container)[0]).toHaveClass('border-primary-500/40', 'bg-primary-500/5');
  });

  it('renders the heading when given, omits it when absent', () => {
    const withHeading = render(
      <Comparison blok={makeBlok({ columns: [makeCard({ heading: 'PROS' })] })} />
    );
    const h = withHeading.container.querySelector('[data-slot="comparison-heading"]');
    expect(h).toHaveTextContent('PROS');

    const without = render(<Comparison blok={makeBlok({ columns: [makeCard()] })} />);
    expect(without.container.querySelector('[data-slot="comparison-heading"]')).toBeNull();
  });

  it('renders the richtext body via renderRichText, omits it when empty', () => {
    const withBody = render(
      <Comparison blok={makeBlok({ columns: [makeCard({ body: 'a-doc' })] })} />
    );
    const b = withBody.container.querySelector('[data-slot="comparison-body"]');
    expect(b).toBeInTheDocument();
    expect(b).toHaveClass('richtext', 'text-foreground');
    expect(b).toContainHTML('<p>rich body</p>');

    const without = render(<Comparison blok={makeBlok({ columns: [makeCard()] })} />);
    expect(without.container.querySelector('[data-slot="comparison-body"]')).toBeNull();
  });

  it('renders the optional parent title, omits it when absent', () => {
    const withTitle = render(
      <Comparison blok={makeBlok({ title: 'Build vs Buy', columns: [makeCard()] })} />
    );
    expect(withTitle.getByRole('heading', { name: 'Build vs Buy' })).toBeInTheDocument();

    const without = render(<Comparison blok={makeBlok({ columns: [makeCard()] })} />);
    expect(without.container.querySelector('h3')).toBeNull();
  });

  it('spreads makeStoryblokEditable attrs onto the wrapper that holds the grid', () => {
    const { container } = render(
      <Comparison blok={makeBlok({ columns: [makeCard()] })} />
    );
    const editable = container.querySelector('[data-testid="sb-editable"]');
    expect(editable).toBeInTheDocument();
    expect(editable).toContainElement(root(container) as HTMLElement);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Alert from '@/components/molecules/Alert';
import type { AlertBlok } from '@/types/storyblok';

// storyblokEditable only emits attrs inside the Visual Editor; renderRichText is
// stubbed to a deterministic HTML string (real richtext rendering is covered by
// the Richtext atom's own tests).
vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: vi.fn(() => ({ 'data-testid': 'sb-editable' })),
  renderRichText: vi.fn((doc: unknown) => (doc ? '<p>rich body</p>' : '')),
}));

// Identifiable stand-ins for the three hi2 glyphs; spread props so className /
// aria-hidden from the molecule still land on the element.
vi.mock('react-icons/hi2', () => ({
  HiOutlineInformationCircle: (p: Record<string, unknown>) => (
    <svg data-testid="icon-information" {...p} />
  ),
  HiOutlineExclamationTriangle: (p: Record<string, unknown>) => (
    <svg data-testid="icon-attention" {...p} />
  ),
  HiOutlineCheckCircle: (p: Record<string, unknown>) => (
    <svg data-testid="icon-checked" {...p} />
  ),
}));

const makeBlok = (overrides: Partial<AlertBlok> = {}): AlertBlok => ({
  _uid: 'a-1',
  component: 'alert',
  ...overrides,
});

const root = (c: HTMLElement) => c.querySelector('[data-slot="alert"]');

describe('Alert (molecule blok wrapper)', () => {
  it('renders defaults: role=note, TL;DR title, emerald accent, information icon', () => {
    const { container, getByTestId } = render(<Alert blok={makeBlok()} />);
    const el = root(container);

    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('role', 'note');
    expect(container.querySelector('[data-slot="alert-title"]')).toHaveTextContent('TL;DR');
    expect(el).toHaveClass(
      'border-emerald-600',
      'text-white',
      'bg-emerald-600',
      'dark:bg-emerald-200',
      'dark:border-emerald-200'
    );
    expect(getByTestId('icon-information')).toBeInTheDocument();
  });

  it('is full-width with no margin on mobile, 75% centered from md up', () => {
    const { container } = render(<Alert blok={makeBlok()} />);
    const el = root(container);
    // Mobile-first: full-bleed with no auto margin; md+ restores the 75% centered card.
    expect(el).toHaveClass('w-full', 'md:w-3/4', 'md:m-auto');
    expect(el).not.toHaveClass('w-3/4', 'm-auto');
  });

  it.each([
    ['emerald', ['border-emerald-600', 'text-white', 'bg-emerald-600', 'dark:bg-emerald-200', 'dark:border-emerald-200']],
    ['primary', ['border-primary-600', 'text-white', 'bg-primary-600', 'dark:bg-primary-200', 'dark:border-primary-200']],
    ['secondary', ['border-secondary-600', 'text-white', 'bg-secondary-600', 'dark:bg-secondary-200', 'dark:border-secondary-200']],
    ['cyan', ['border-cyan-800', 'text-white', 'bg-cyan-800', 'dark:bg-cyan-800', 'dark:border-cyan-800']],
    ['magenta', ['border-viva-magenta-600', 'text-white', 'bg-viva-magenta-600', 'dark:bg-viva-magenta-200', 'dark:border-viva-magenta-200']],
  ] as const)('applies the %s accent classes', (color, classes) => {
    const { container } = render(<Alert blok={makeBlok({ color })} />);
    expect(root(container)).toHaveClass(...classes);
  });

  it.each([
    ['information', 'icon-information'],
    ['attention', 'icon-attention'],
    ['checked', 'icon-checked'],
  ] as const)('renders the %s icon glyph', (icon, testId) => {
    const { getByTestId } = render(<Alert blok={makeBlok({ icon })} />);
    const svg = getByTestId(testId);
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveClass('size-6', 'shrink-0');
  });

  it('renders a custom title', () => {
    const { container } = render(<Alert blok={makeBlok({ title: 'Heads up' })} />);
    expect(container.querySelector('[data-slot="alert-title"]')).toHaveTextContent('Heads up');
  });

  it('renders the richtext body inside AlertDescription at text-white', () => {
    const { container } = render(<Alert blok={makeBlok({ body: 'a-doc' })} />);
    const desc = container.querySelector('[data-slot="alert-description"]');
    expect(desc).toBeInTheDocument();
    expect(desc).toHaveClass('richtext', 'text-white');
    expect(desc).toContainHTML('<p>rich body</p>');
  });

  it('renders no description when the body is empty', () => {
    const { container } = render(<Alert blok={makeBlok()} />);
    expect(container.querySelector('[data-slot="alert-description"]')).not.toBeInTheDocument();
  });

  it('spreads makeStoryblokEditable attrs onto the root', () => {
    const { container } = render(<Alert blok={makeBlok()} />);
    expect(container.querySelector('[data-testid="sb-editable"]')).toBe(root(container));
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound, { metadata } from '@/app/not-found';

describe('NotFound', () => {
  // Without its own title the 404 inherits the home page <title>; the layout
  // template renders this as "Page not found | Notes of Dev".
  it('exports its own page title', () => {
    expect(metadata.title).toBe('Page not found');
  });

  it('renders without crashing', () => {
    expect(() => render(<NotFound />)).not.toThrow();
  });

  it('displays 404 heading', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404');
  });

  it('displays Page Not Found heading', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Page Not Found');
  });

  it('displays apology message', () => {
    render(<NotFound />);
    expect(screen.getByText(/couldn't find the page/i)).toBeInTheDocument();
  });

  it('renders a link back to home', () => {
    render(<NotFound />);
    const link = screen.getByRole('link', { name: /go back home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuToggle from '@/components/atoms/MenuToggle';

describe('MenuToggle', () => {
  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const onClick = vi.fn();
      render(<MenuToggle onClick={onClick} isOpen={false} />);

      const button = screen.getByRole('button', { name: /toggle menu/i });
      expect(button).toBeInTheDocument();
    });

    it('renders with correct aria-label', () => {
      const onClick = vi.fn();
      render(<MenuToggle onClick={onClick} isOpen={false} />);

      const button = screen.getByLabelText('Toggle menu');
      expect(button).toBeInTheDocument();
    });

    it('has correct button type', () => {
      const onClick = vi.fn();
      render(<MenuToggle onClick={onClick} isOpen={false} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('renders three span elements for hamburger icon', () => {
      const onClick = vi.fn();
      const { container } = render(<MenuToggle onClick={onClick} isOpen={false} />);

      const spans = container.querySelectorAll('span');
      expect(spans).toHaveLength(3);
    });
  });

  // ============================================================================
  // Props Handling Tests
  // ============================================================================

  describe('Props Handling', () => {
    it('applies closed state classes when isOpen is false', () => {
      const onClick = vi.fn();
      const { container } = render(<MenuToggle onClick={onClick} isOpen={false} />);

      const spans = container.querySelectorAll('span');
      expect(spans[0]).toHaveClass('rotate-0');
      expect(spans[1]).toHaveClass('opacity-100', 'scale-100');
      expect(spans[2]).toHaveClass('rotate-0');
    });

    it('applies open state classes when isOpen is true', () => {
      const onClick = vi.fn();
      const { container } = render(<MenuToggle onClick={onClick} isOpen={true} />);

      const spans = container.querySelectorAll('span');
      expect(spans[0]).toHaveClass('rotate-45');
      expect(spans[1]).toHaveClass('opacity-0', 'scale-0');
      expect(spans[2]).toHaveClass('-rotate-45');
    });
  });

  // ============================================================================
  // User Interaction Tests
  // ============================================================================

  describe('User Interactions', () => {
    it('calls onClick when button is clicked', () => {
      const onClick = vi.fn();
      render(<MenuToggle onClick={onClick} isOpen={false} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick multiple times on multiple clicks', () => {
      const onClick = vi.fn();
      render(<MenuToggle onClick={onClick} isOpen={false} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================================
  // Conditional Rendering Tests
  // ============================================================================

  describe('Conditional Rendering', () => {
    it('transitions between open and closed states', () => {
      const onClick = vi.fn();
      const { container, rerender } = render(<MenuToggle onClick={onClick} isOpen={false} />);

      // Check closed state
      let spans = container.querySelectorAll('span');
      expect(spans[1]).toHaveClass('opacity-100');

      // Rerender with open state
      rerender(<MenuToggle onClick={onClick} isOpen={true} />);

      // Check open state
      spans = container.querySelectorAll('span');
      expect(spans[1]).toHaveClass('opacity-0');
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('is keyboard accessible', () => {
      const onClick = vi.fn();
      render(<MenuToggle onClick={onClick} isOpen={false} />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('has hidden class for large screens', () => {
      const onClick = vi.fn();
      render(<MenuToggle onClick={onClick} isOpen={false} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('lg:hidden');
    });
  });
});

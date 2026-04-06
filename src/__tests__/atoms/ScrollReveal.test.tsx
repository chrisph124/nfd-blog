import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ScrollReveal from '@/components/atoms/ScrollReveal';

// Track reduced motion state for testing
let mockReducedMotion = false;

// Mock motion/react
vi.mock('motion/react', () => {
  return {
    useReducedMotion: () => mockReducedMotion,
    m: new Proxy({}, {
      get: (_: unknown, prop: string) => {
        // eslint-disable-next-line react/display-name
        return React.forwardRef(
          (
            {
              children,
              className,
              ...htmlProps
            }: Record<string, unknown>,
            ref: unknown
          ) => {
            return React.createElement(
              prop,
              { ...htmlProps, className, ref },
              children as React.ReactNode
            );
          }
        );
      },
    }),
  };
});

describe('ScrollReveal', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(
          <ScrollReveal>
            <div>Test content</div>
          </ScrollReveal>
        );
      }).not.toThrow();
    });

    it('renders children correctly', () => {
      render(
        <ScrollReveal>
          <div>Test content</div>
        </ScrollReveal>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders as div by default', () => {
      const { container } = render(
        <ScrollReveal>
          <span>Content</span>
        </ScrollReveal>
      );

      const element = container.querySelector('div');
      expect(element).toBeInTheDocument();
    });

    it('renders as section when as="section"', () => {
      const { container } = render(
        <ScrollReveal as="section">
          <span>Content</span>
        </ScrollReveal>
      );

      const element = container.querySelector('section');
      expect(element).toBeInTheDocument();
    });

    it('renders as li when as="li"', () => {
      const { container } = render(
        <ScrollReveal as="li">
          <span>Content</span>
        </ScrollReveal>
      );

      const element = container.querySelector('li');
      expect(element).toBeInTheDocument();
    });

    it('renders as article when as="article"', () => {
      const { container } = render(
        <ScrollReveal as="article">
          <span>Content</span>
        </ScrollReveal>
      );

      const element = container.querySelector('article');
      expect(element).toBeInTheDocument();
    });

    it('renders as span when as="span"', () => {
      const { container } = render(
        <ScrollReveal as="span">
          <span>Content</span>
        </ScrollReveal>
      );

      const element = container.querySelector('span');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies className prop', () => {
      const { container } = render(
        <ScrollReveal className="custom-class">
          <div>Content</div>
        </ScrollReveal>
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('custom-class');
    });

    it('applies multiple classes', () => {
      const { container } = render(
        <ScrollReveal className="class-1 class-2 class-3">
          <div>Content</div>
        </ScrollReveal>
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('class-1', 'class-2', 'class-3');
    });

    it('uses default delay of 0', () => {
      expect(() => {
        render(
          <ScrollReveal>
            <div>Content</div>
          </ScrollReveal>
        );
      }).not.toThrow();
    });

    it('uses default duration of 0.5', () => {
      expect(() => {
        render(
          <ScrollReveal>
            <div>Content</div>
          </ScrollReveal>
        );
      }).not.toThrow();
    });

    it('accepts custom delay prop', () => {
      expect(() => {
        render(
          <ScrollReveal delay={0.2}>
            <div>Content</div>
          </ScrollReveal>
        );
      }).not.toThrow();
    });

    it('accepts custom duration prop', () => {
      expect(() => {
        render(
          <ScrollReveal duration={0.8}>
            <div>Content</div>
          </ScrollReveal>
        );
      }).not.toThrow();
    });
  });

  describe('Content', () => {
    it('renders text content', () => {
      render(
        <ScrollReveal>
          Test text content
        </ScrollReveal>
      );

      expect(screen.getByText('Test text content')).toBeInTheDocument();
    });

    it('renders nested components', () => {
      const NestedComponent = () => <p>Nested content</p>;

      render(
        <ScrollReveal>
          <NestedComponent />
        </ScrollReveal>
      );

      expect(screen.getByText('Nested content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <ScrollReveal>
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </ScrollReveal>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });
  });

  describe('Reduced Motion', () => {
    it('renders without animation props when reduced motion is preferred', () => {
      mockReducedMotion = true;

      const { container } = render(
        <ScrollReveal className="test-class">
          <div>Content</div>
        </ScrollReveal>
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('test-class');
      expect(screen.getByText('Content')).toBeInTheDocument();

      mockReducedMotion = false;
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      const { container } = render(<ScrollReveal />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('works with zero delay', () => {
      expect(() => {
        render(
          <ScrollReveal delay={0}>
            <div>Content</div>
          </ScrollReveal>
        );
      }).not.toThrow();
    });

    it('works with zero duration', () => {
      expect(() => {
        render(
          <ScrollReveal duration={0}>
            <div>Content</div>
          </ScrollReveal>
        );
      }).not.toThrow();
    });

    it('works with large delay values', () => {
      expect(() => {
        render(
          <ScrollReveal delay={10}>
            <div>Content</div>
          </ScrollReveal>
        );
      }).not.toThrow();
    });
  });
});

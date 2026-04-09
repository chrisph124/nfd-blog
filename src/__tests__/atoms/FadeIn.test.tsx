import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import FadeIn from '@/components/atoms/FadeIn';

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

describe('FadeIn', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(
          <FadeIn>
            <div>Test content</div>
          </FadeIn>
        );
      }).not.toThrow();
    });

    it('renders children correctly', () => {
      render(
        <FadeIn>
          <div>Test content</div>
        </FadeIn>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders as div by default', () => {
      const { container } = render(
        <FadeIn>
          <span>Content</span>
        </FadeIn>
      );

      const element = container.querySelector('div');
      expect(element).toBeInTheDocument();
    });

    it('renders as section when as="section"', () => {
      const { container } = render(
        <FadeIn as="section">
          <span>Content</span>
        </FadeIn>
      );

      const element = container.querySelector('section');
      expect(element).toBeInTheDocument();
    });

    it('renders as li when as="li"', () => {
      const { container } = render(
        <FadeIn as="li">
          <span>Content</span>
        </FadeIn>
      );

      const element = container.querySelector('li');
      expect(element).toBeInTheDocument();
    });

    it('renders as article when as="article"', () => {
      const { container } = render(
        <FadeIn as="article">
          <span>Content</span>
        </FadeIn>
      );

      const element = container.querySelector('article');
      expect(element).toBeInTheDocument();
    });

    it('renders as span when as="span"', () => {
      const { container } = render(
        <FadeIn as="span">
          <span>Content</span>
        </FadeIn>
      );

      const element = container.querySelector('span');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies className prop', () => {
      const { container } = render(
        <FadeIn className="custom-class">
          <div>Content</div>
        </FadeIn>
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('custom-class');
    });

    it('applies multiple classes', () => {
      const { container } = render(
        <FadeIn className="class-1 class-2 class-3">
          <div>Content</div>
        </FadeIn>
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('class-1', 'class-2', 'class-3');
    });

    it('uses default delay of 0', () => {
      expect(() => {
        render(
          <FadeIn>
            <div>Content</div>
          </FadeIn>
        );
      }).not.toThrow();
    });

    it('uses default duration of 0.4', () => {
      expect(() => {
        render(
          <FadeIn>
            <div>Content</div>
          </FadeIn>
        );
      }).not.toThrow();
    });

    it('accepts custom delay prop', () => {
      expect(() => {
        render(
          <FadeIn delay={0.2}>
            <div>Content</div>
          </FadeIn>
        );
      }).not.toThrow();
    });

    it('accepts custom duration prop', () => {
      expect(() => {
        render(
          <FadeIn duration={0.8}>
            <div>Content</div>
          </FadeIn>
        );
      }).not.toThrow();
    });
  });

  describe('Content', () => {
    it('renders text content', () => {
      render(
        <FadeIn>
          Test text content
        </FadeIn>
      );

      expect(screen.getByText('Test text content')).toBeInTheDocument();
    });

    it('renders nested components', () => {
      const NestedComponent = () => <p>Nested content</p>;

      render(
        <FadeIn>
          <NestedComponent />
        </FadeIn>
      );

      expect(screen.getByText('Nested content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <FadeIn>
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </FadeIn>
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
        <FadeIn className="test-class">
          <div>Content</div>
        </FadeIn>
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('test-class');
      expect(screen.getByText('Content')).toBeInTheDocument();

      mockReducedMotion = false;
    });
  });

  describe('Direction Prop', () => {
    it('renders with direction="up" without crashing', () => {
      expect(() => {
        render(
          <FadeIn direction="up">
            <div>Content</div>
          </FadeIn>
        );
      }).not.toThrow();
    });

    it('renders with direction="down" without crashing', () => {
      expect(() => {
        render(
          <FadeIn direction="down">
            <div>Content</div>
          </FadeIn>
        );
      }).not.toThrow();
    });

    it('renders with direction="left" without crashing', () => {
      expect(() => {
        render(
          <FadeIn direction="left">
            <div>Content</div>
          </FadeIn>
        );
      }).not.toThrow();
    });

    it('renders with direction="right" without crashing', () => {
      expect(() => {
        render(
          <FadeIn direction="right">
            <div>Content</div>
          </FadeIn>
        );
      }).not.toThrow();
    });

    it('uses default direction of "up"', () => {
      expect(() => {
        render(
          <FadeIn>
            <div>Content</div>
          </FadeIn>
        );
      }).not.toThrow();
    });

    it('renders children with direction prop', () => {
      render(
        <FadeIn direction="left">
          <div>Direction content</div>
        </FadeIn>
      );
      expect(screen.getByText('Direction content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      const { container } = render(<FadeIn>{null}</FadeIn>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('works with zero delay', () => {
      expect(() => {
        render(
          <FadeIn delay={0}>
            <div>Content</div>
          </FadeIn>
        );
      }).not.toThrow();
    });

    it('works with zero duration', () => {
      expect(() => {
        render(
          <FadeIn duration={0}>
            <div>Content</div>
          </FadeIn>
        );
      }).not.toThrow();
    });

    it('works with large delay values', () => {
      expect(() => {
        render(
          <FadeIn delay={10}>
            <div>Content</div>
          </FadeIn>
        );
      }).not.toThrow();
    });
  });
});

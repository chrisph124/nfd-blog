import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MotionProvider from '@/components/providers/MotionProvider';

// Mock motion/react
vi.mock('motion/react', () => ({
  LazyMotion: ({ children, features, strict }: { children: React.ReactNode; features: unknown; strict: boolean }) => (
    <div data-testid="lazy-motion" data-features={String(features)} data-strict={String(strict)}>
      {children}
    </div>
  ),
  domAnimation: {},
}));

describe('MotionProvider', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(
          <MotionProvider>
            <div>Test content</div>
          </MotionProvider>
        );
      }).not.toThrow();
    });

    it('renders children correctly', () => {
      render(
        <MotionProvider>
          <div>Test content</div>
        </MotionProvider>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('wraps children with LazyMotion', () => {
      const { getByTestId } = render(
        <MotionProvider>
          <div>Test content</div>
        </MotionProvider>
      );

      const lazyMotion = getByTestId('lazy-motion');
      expect(lazyMotion).toBeInTheDocument();
    });

    it('passes strict prop to LazyMotion', () => {
      const { getByTestId } = render(
        <MotionProvider>
          <div>Test content</div>
        </MotionProvider>
      );

      const lazyMotion = getByTestId('lazy-motion');
      expect(lazyMotion).toHaveAttribute('data-strict', 'true');
    });
  });

  describe('Content', () => {
    it('renders multiple children', () => {
      render(
        <MotionProvider>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </MotionProvider>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('renders React components as children', () => {
      const TestComponent = () => <p>Test component content</p>;

      render(
        <MotionProvider>
          <TestComponent />
        </MotionProvider>
      );

      expect(screen.getByText('Test component content')).toBeInTheDocument();
    });
  });
});

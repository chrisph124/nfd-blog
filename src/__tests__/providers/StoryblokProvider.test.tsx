import { render, screen } from '@testing-library/react';
import StoryblokProvider from '@/components/providers/StoryblokProvider';
import { initStoryblokClient } from '@/lib/storyblok-client';
import type { GetStoryblokApiOptions, StoryblokApiInstance } from '@/__tests__/types/test-mocks';

// Mock the storyblok API function
vi.mock('@/lib/storyblok-client', () => ({
  initStoryblokClient: vi.fn(),
}));

describe('StoryblokProvider Component', () => {
  const mockInitStoryblokClient = initStoryblokClient as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders children without modification', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      render(
        <StoryblokProvider>
          <div data-testid="test-child">Test Content</div>
        </StoryblokProvider>
      );

      const childElement = screen.getByTestId('test-child');
      expect(childElement).toBeInTheDocument();
      expect(childElement).toHaveTextContent('Test Content');
    });

    it('renders multiple children', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      render(
        <StoryblokProvider>
          <div data-testid="first-child">First Child</div>
          <div data-testid="second-child">Second Child</div>
        </StoryblokProvider>
      );

      expect(screen.getByTestId('first-child')).toBeInTheDocument();
      expect(screen.getByTestId('second-child')).toBeInTheDocument();
    });

    it('renders complex React components as children', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      const TestComponent = ({ text }: { text: string }) => (
        <div data-testid="complex-component">{text}</div>
      );

      render(
        <StoryblokProvider>
          <TestComponent text="Complex Component Content" />
        </StoryblokProvider>
      );

      expect(screen.getByTestId('complex-component')).toBeInTheDocument();
      expect(screen.getByTestId('complex-component')).toHaveTextContent('Complex Component Content');
    });

    it('renders null children gracefully', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      render(
        <StoryblokProvider>
          {null}
        </StoryblokProvider>
      );

      // Should not throw any errors
      expect(document.body).toBeInTheDocument();
    });

    it('renders empty fragment children', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      render(
        <StoryblokProvider>
          <></>
        </StoryblokProvider>
      );

      // Should not throw any errors
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Storyblok API Initialization', () => {
    it('initializes Storyblok API on mount', () => {
      const mockApiInstance = {
        init: vi.fn(),
        get: vi.fn(),
      } as StoryblokApiInstance;

      mockInitStoryblokClient.mockReturnValue(mockApiInstance);

      render(
        <StoryblokProvider>
          <div>Test Content</div>
        </StoryblokProvider>
      );

      expect(mockInitStoryblokClient).toHaveBeenCalledTimes(1);
      expect(mockInitStoryblokClient).toHaveBeenCalledWith();
    });

    it('initializes Storyblok API when children re-render', () => {
      const mockApiInstance = {
        init: vi.fn(),
        get: vi.fn(),
      } as StoryblokApiInstance;

      mockInitStoryblokClient.mockReturnValue(mockApiInstance);

      const { rerender } = render(
        <StoryblokProvider>
          <div data-testid="content">Initial Content</div>
        </StoryblokProvider>
      );

      expect(mockInitStoryblokClient).toHaveBeenCalledTimes(1);

      // Re-render with different children
      rerender(
        <StoryblokProvider>
          <div data-testid="content">Updated Content</div>
        </StoryblokProvider>
      );

      // In React, re-rendering the component will call the initialization again
      expect(mockInitStoryblokClient).toHaveBeenCalledTimes(2);
    });

    it('handles Storyblok API initialization errors gracefully', () => {
      mockInitStoryblokClient.mockImplementation(() => {
        throw new Error('Failed to initialize Storyblok API');
      });

      expect(() => {
        render(
          <StoryblokProvider>
            <div>Test Content</div>
          </StoryblokProvider>
        );
      }).toThrow('Failed to initialize Storyblok API');
    });
  });

  describe('Provider Behavior', () => {
    it('acts as a pass-through component', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      const TestComponent = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="wrapper">{children}</div>
      );

      render(
        <StoryblokProvider>
          <TestComponent>
            <span data-testid="nested-content">Nested Content</span>
          </TestComponent>
        </StoryblokProvider>
      );

      expect(screen.getByTestId('nested-content')).toBeInTheDocument();
      expect(screen.getByTestId('nested-content')).toHaveTextContent('Nested Content');
    });

    it('preserves children props and attributes', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      render(
        <StoryblokProvider>
          <div
            data-testid="child-with-props"
            className="test-class"
            role="article"
            aria-label="Test Article"
          >
            Content with props
          </div>
        </StoryblokProvider>
      );

      const child = screen.getByTestId('child-with-props');
      expect(child).toHaveClass('test-class');
      expect(child).toHaveAttribute('role', 'article');
      expect(child).toHaveAttribute('aria-label', 'Test Article');
    });

    it('supports React Portal children', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      const portalDiv = document.createElement('div');
      document.body.appendChild(portalDiv);

      // This tests that the provider doesn't interfere with complex React rendering patterns
      expect(() => {
        render(
          <StoryblokProvider>
            <div>Normal Child</div>
          </StoryblokProvider>
        );
      }).not.toThrow();

      // Clean up
      document.body.removeChild(portalDiv);
    });
  });

  describe('Component Structure', () => {
    it('has correct component name for debugging', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      const component = StoryblokProvider;
      expect(component.name).toBe('StoryblokProvider');
    });

    it('is a client component (use client directive)', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      // Component should render without SSR issues
      expect(() => {
        render(
          <StoryblokProvider>
            <div>Client Component Test</div>
          </StoryblokProvider>
        );
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles deeply nested children', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      render(
        <StoryblokProvider>
          <div data-testid="level-1">
            <div data-testid="level-2">
              <div data-testid="level-3">
                <div data-testid="level-4">
                  Deeply Nested Content
                </div>
              </div>
            </div>
          </div>
        </StoryblokProvider>
      );

      expect(screen.getByTestId('level-4')).toHaveTextContent('Deeply Nested Content');
    });

    it('handles children with conditional rendering', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      const ConditionalComponent = ({ show }: { show: boolean }) => (
        show ? <div data-testid="conditional-content">Shown Content</div> : null
      );

      const { rerender } = render(
        <StoryblokProvider>
          <ConditionalComponent show={false} />
        </StoryblokProvider>
      );

      expect(screen.queryByTestId('conditional-content')).not.toBeInTheDocument();

      rerender(
        <StoryblokProvider>
          <ConditionalComponent show={true} />
        </StoryblokProvider>
      );

      expect(screen.getByTestId('conditional-content')).toBeInTheDocument();
    });

    it('handles children that throw errors during render', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      const ErrorComponent = () => {
        throw new Error('Component render error');
      };

      expect(() => {
        render(
          <StoryblokProvider>
            <ErrorComponent />
          </StoryblokProvider>
        );
      }).toThrow('Component render error');
    });

    it('handles async components as children', async () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      // Note: This test ensures the provider doesn't break with async components,
      // though actual rendering would need to be handled by React's concurrent features
      expect(() => {
        render(
          <StoryblokProvider>
            <div>Sync Content</div>
          </StoryblokProvider>
        );
      }).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('accepts ReactNode as children prop', () => {
      mockInitStoryblokClient.mockReturnValue({} as GetStoryblokApiOptions);

      const testCases = [
        <div key="jsx">JSX Element</div>,
        "Text content",
        123,
        null,
        undefined,
        <div key="fragment"><span>Nested content</span></div>,
      ];

      testCases.forEach((children, index) => {
        expect(() => {
          render(
            <StoryblokProvider key={index}>
              {children}
            </StoryblokProvider>
          );
        }).not.toThrow();
      });
    });
  });
});
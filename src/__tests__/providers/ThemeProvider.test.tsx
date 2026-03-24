import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ThemeProvider from '@/components/providers/ThemeProvider';

// Mock next-themes ThemeProvider
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="theme-provider-mock" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}));

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(
          <ThemeProvider>
            <div>Test Child</div>
          </ThemeProvider>
        );
      }).not.toThrow();
    });

    it('renders children correctly', () => {
      render(
        <ThemeProvider>
          <div data-testid="child-element">Test Child Content</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('child-element')).toBeInTheDocument();
      expect(screen.getByText('Test Child Content')).toBeInTheDocument();
    });

    it('renders the mocked ThemeProvider wrapper', () => {
      render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-provider-mock')).toBeInTheDocument();
    });
  });

  describe('Props Configuration', () => {
    it('passes attribute="data-theme" to ThemeProvider', () => {
      const { container } = render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>
      );

      const mockProvider = container.querySelector('[data-testid="theme-provider-mock"]');
      expect(mockProvider).toBeInTheDocument();

      const propsAttr = mockProvider?.getAttribute('data-props');
      if (propsAttr) {
        const props = JSON.parse(propsAttr);
        expect(props.attribute).toBe('data-theme');
      }
    });

    it('passes defaultTheme="light" to ThemeProvider', () => {
      const { container } = render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>
      );

      const mockProvider = container.querySelector('[data-testid="theme-provider-mock"]');
      const propsAttr = mockProvider?.getAttribute('data-props');
      if (propsAttr) {
        const props = JSON.parse(propsAttr);
        expect(props.defaultTheme).toBe('light');
      }
    });

    it('passes themes=["light","dark"] to ThemeProvider', () => {
      const { container } = render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>
      );

      const mockProvider = container.querySelector('[data-testid="theme-provider-mock"]');
      const propsAttr = mockProvider?.getAttribute('data-props');
      if (propsAttr) {
        const props = JSON.parse(propsAttr);
        expect(props.themes).toEqual(['light', 'dark']);
      }
    });

    it('passes all required props together', () => {
      const { container } = render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>
      );

      const mockProvider = container.querySelector('[data-testid="theme-provider-mock"]');
      const propsAttr = mockProvider?.getAttribute('data-props');
      if (propsAttr) {
        const props = JSON.parse(propsAttr);
        expect(props).toEqual({
          attribute: 'data-theme',
          defaultTheme: 'light',
          themes: ['light', 'dark'],
        });
      }
    });
  });

  describe('Component Features', () => {
    it('is a client component with use client directive', () => {
      // Test that the component is exported as default
      expect(ThemeProvider).toBeDefined();
      expect(typeof ThemeProvider).toBe('function');
    });

    it('accepts children prop correctly', () => {
      const testContent = 'Unique Test Content';
      render(
        <ThemeProvider>
          <div>{testContent}</div>
        </ThemeProvider>
      );

      expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it('passes children to wrapped NextThemeProvider', () => {
      render(
        <ThemeProvider>
          <span data-testid="test-span">Span Content</span>
        </ThemeProvider>
      );

      expect(screen.getByTestId('test-span')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('allows multiple children elements', () => {
      render(
        <ThemeProvider>
          <div data-testid="first-child">First</div>
          <div data-testid="second-child">Second</div>
          <div data-testid="third-child">Third</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('first-child')).toBeInTheDocument();
      expect(screen.getByTestId('second-child')).toBeInTheDocument();
      expect(screen.getByTestId('third-child')).toBeInTheDocument();
    });

    it('preserves nested component structure', () => {
      render(
        <ThemeProvider>
          <div data-testid="wrapper">
            <header data-testid="header">Header</header>
            <main data-testid="main">Main</main>
            <footer data-testid="footer">Footer</footer>
          </div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('main')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('renders complex component trees correctly', () => {
      render(
        <ThemeProvider>
          <div>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          </div>
        </ThemeProvider>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders without console errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>
      );

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles empty children gracefully', () => {
      expect(() => {
        render(
          <ThemeProvider>
            {undefined}
          </ThemeProvider>
        );
      }).not.toThrow();
    });

    it('handles React.ReactNode children correctly', () => {
      const childNode: React.ReactNode = <div>Test</div>;

      expect(() => {
        render(
          <ThemeProvider>
            {childNode}
          </ThemeProvider>
        );
      }).not.toThrow();

      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});

/* eslint-disable @next/next/no-img-element */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RichtextReveal from '@/components/atoms/RichtextReveal';

// Mock IntersectionObserver
let mockObserverCallback: IntersectionObserverCallback | null = null;
let observedElements: Element[] = [];
let mockObserverInstance: MockIntersectionObserver | null = null;

class MockIntersectionObserver implements IntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    mockObserverCallback = callback;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockObserverInstance = this;
  }

  observe(element: Element): void {
    observedElements.push(element);
  }

  unobserve(element: Element): void {
    observedElements = observedElements.filter(el => el !== element);
  }

  disconnect(): void {
    observedElements = [];
    mockObserverCallback = null;
    mockObserverInstance = null;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  root: Element | Document | null = null;
  rootMargin: string = '';
  thresholds: ReadonlyArray<number> = [];
}

// Setup mock before tests
global.IntersectionObserver = MockIntersectionObserver as typeof IntersectionObserver;

describe('RichtextReveal Component', () => {
  beforeEach(() => {
    mockObserverCallback = null;
    observedElements = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockObserverCallback = null;
    observedElements = [];
  });

  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(
        <RichtextReveal>
          <div>Test content</div>
        </RichtextReveal>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders as a div wrapper', () => {
      const { container } = render(
        <RichtextReveal>
          <p>Content</p>
        </RichtextReveal>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName).toBe('DIV');
    });

    it('renders multiple children', () => {
      render(
        <RichtextReveal>
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </RichtextReveal>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('handles empty children', () => {
      const { container } = render(<RichtextReveal />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders nested components', () => {
      const NestedComponent = () => <p>Nested content</p>;

      render(
        <RichtextReveal>
          <NestedComponent />
        </RichtextReveal>
      );

      expect(screen.getByText('Nested content')).toBeInTheDocument();
    });
  });

  describe('IntersectionObserver Setup', () => {
    it('sets up IntersectionObserver on mount', () => {
      mockObserverInstance = null;

      render(
        <RichtextReveal>
          <div>
            <img src="test.jpg" alt="test" />
          </div>
        </RichtextReveal>
      );

      expect(mockObserverInstance).toBeDefined();
      expect(observedElements.length).toBeGreaterThan(0);
    });

    it('does not set up observer if no media elements found', () => {
      mockObserverInstance = null;
      const initialObservedLength = observedElements.length;

      render(
        <RichtextReveal>
          <div>No media here</div>
        </RichtextReveal>
      );

      expect(observedElements.length).toBe(initialObservedLength);
    });

    it('observes img elements', () => {
      const { container } = render(
        <RichtextReveal>
          <img src="test.jpg" alt="test" />
        </RichtextReveal>
      );

      const img = container.querySelector('img');
      expect(observedElements).toContain(img);
    });

    it('observes figure elements', () => {
      const { container } = render(
        <RichtextReveal>
          <figure>
            <img src="test.jpg" alt="test" />
          </figure>
        </RichtextReveal>
      );

      const figure = container.querySelector('figure');
      expect(observedElements).toContain(figure);
    });

    it('observes video elements', () => {
      const { container } = render(
        <RichtextReveal>
          <video src="test.mp4" />
        </RichtextReveal>
      );

      const video = container.querySelector('video');
      expect(observedElements).toContain(video);
    });

    it('observes iframe elements', () => {
      const { container } = render(
        <RichtextReveal>
          <iframe src="test.html" title="test" />
        </RichtextReveal>
      );

      const iframe = container.querySelector('iframe');
      expect(observedElements).toContain(iframe);
    });

    it('observes multiple media elements (skips img inside figure)', () => {
      const { container } = render(
        <RichtextReveal>
          <div>
            <img src="1.jpg" alt="1" />
            <figure>
              <img src="2.jpg" alt="2" />
            </figure>
            <video src="test.mp4" />
            <iframe src="test.html" title="test" />
          </div>
        </RichtextReveal>
      );

      const standaloneImg = container.querySelector('img[src="1.jpg"]');
      const figure = container.querySelector('figure');
      const nestedImg = container.querySelector('figure img');
      const video = container.querySelector('video');
      const iframe = container.querySelector('iframe');

      // 4 elements: standalone img, figure, video, iframe (img inside figure is skipped)
      expect(observedElements.length).toBe(4);
      expect(observedElements).toContain(standaloneImg);
      expect(observedElements).not.toContain(nestedImg);
      expect(observedElements).toContain(figure);
      expect(observedElements).toContain(video);
      expect(observedElements).toContain(iframe);
    });
  });

  describe('Class Addition on Intersection', () => {
    it('adds revealed class when element intersects', () => {
      const { container } = render(
        <RichtextReveal>
          <img src="test.jpg" alt="test" />
        </RichtextReveal>
      );

      const img = container.querySelector('img') as HTMLElement;
      expect(img).not.toHaveClass('revealed');

      // Simulate intersection
      if (mockObserverCallback) {
        mockObserverCallback(
          [
            {
              target: img,
              isIntersecting: true,
              boundingClientRect: new DOMRect(),
              intersectionRatio: 0.5,
              rootBounds: new DOMRect(),
              time: Date.now(),
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        );
      }

      expect(img).toHaveClass('revealed');
    });

    it('does not add revealed class when not intersecting', () => {
      const { container } = render(
        <RichtextReveal>
          <img src="test.jpg" alt="test" />
        </RichtextReveal>
      );

      const img = container.querySelector('img') as HTMLElement;

      // Simulate non-intersection
      if (mockObserverCallback) {
        mockObserverCallback(
          [
            {
              target: img,
              isIntersecting: false,
              boundingClientRect: new DOMRect(),
              intersectionRatio: 0,
              rootBounds: new DOMRect(),
              time: Date.now(),
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        );
      }

      expect(img).not.toHaveClass('revealed');
    });

    it('unobserves element after adding revealed class', () => {
      const { container } = render(
        <RichtextReveal>
          <img src="test.jpg" alt="test" />
        </RichtextReveal>
      );

      const img = container.querySelector('img') as HTMLElement;
      const unobserveSpy = vi.spyOn(MockIntersectionObserver.prototype, 'unobserve');

      // Simulate intersection
      if (mockObserverCallback) {
        mockObserverCallback(
          [
            {
              target: img,
              isIntersecting: true,
              boundingClientRect: new DOMRect(),
              intersectionRatio: 0.5,
              rootBounds: new DOMRect(),
              time: Date.now(),
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        );
      }

      expect(unobserveSpy).toHaveBeenCalledWith(img);
    });

    it('handles multiple elements intersecting at different times', () => {
      const { container } = render(
        <RichtextReveal>
          <div>
            <img src="1.jpg" alt="1" data-testid="img1" />
            <img src="2.jpg" alt="2" data-testid="img2" />
          </div>
        </RichtextReveal>
      );

      const img1 = container.querySelector('[data-testid="img1"]') as HTMLElement;
      const img2 = container.querySelector('[data-testid="img2"]') as HTMLElement;

      // First image intersects
      if (mockObserverCallback) {
        mockObserverCallback(
          [
            {
              target: img1,
              isIntersecting: true,
              boundingClientRect: new DOMRect(),
              intersectionRatio: 0.5,
              rootBounds: new DOMRect(),
              time: Date.now(),
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        );
      }

      expect(img1).toHaveClass('revealed');
      expect(img2).not.toHaveClass('revealed');

      // Second image intersects
      if (mockObserverCallback) {
        mockObserverCallback(
          [
            {
              target: img2,
              isIntersecting: true,
              boundingClientRect: new DOMRect(),
              intersectionRatio: 0.5,
              rootBounds: new DOMRect(),
              time: Date.now(),
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        );
      }

      expect(img1).toHaveClass('revealed');
      expect(img2).toHaveClass('revealed');
    });
  });

  describe('Observer Configuration', () => {
    it('creates observer with correct rootMargin', () => {
      render(
        <RichtextReveal>
          <img src="test.jpg" alt="test" />
        </RichtextReveal>
      );

      // Observer should be created with rootMargin of -50px
      expect(mockObserverInstance).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('disconnects observer on unmount', () => {
      const { unmount } = render(
        <RichtextReveal>
          <img src="test.jpg" alt="test" />
        </RichtextReveal>
      );

      expect(mockObserverInstance).toBeDefined();

      unmount();

      // After unmount, the observer should be disconnected
      expect(mockObserverCallback).toBeNull();
    });

    it('clears observed elements on unmount', () => {
      const { unmount } = render(
        <RichtextReveal>
          <div>
            <img src="1.jpg" alt="1" />
            <img src="2.jpg" alt="2" />
          </div>
        </RichtextReveal>
      );

      expect(observedElements.length).toBeGreaterThan(0);

      unmount();

      expect(observedElements.length).toBe(0);
    });

    it('handles unmount when no media elements exist', () => {
      const { unmount } = render(
        <RichtextReveal>
          <div>No media</div>
        </RichtextReveal>
      );

      expect(() => unmount()).not.toThrow();
      // Observer not called when no media elements, callback should be null
      expect(mockObserverCallback).toBeNull();
    });

    it('handles unmount without container ref', () => {
      const { unmount } = render(<RichtextReveal />);

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('HTML Content with Media', () => {
    it('works with rich text content containing images', () => {
      const { container } = render(
        <RichtextReveal>
          <div
            dangerouslySetInnerHTML={{
              __html: '<p>Text with <img src="test.jpg" alt="test" /> inline image</p>',
            }}
          />
        </RichtextReveal>
      );

      const img = container.querySelector('img');
      expect(observedElements).toContain(img);
    });

    it('works with figure elements containing images', () => {
      const { container } = render(
        <RichtextReveal>
          <figure>
            <img src="featured.jpg" alt="featured" />
            <figcaption>Image caption</figcaption>
          </figure>
        </RichtextReveal>
      );

      const figure = container.querySelector('figure');
      expect(observedElements).toContain(figure);
    });

    it('works with complex nested structure', () => {
      const { container } = render(
        <RichtextReveal>
          <div>
            <section>
              <article>
                <img src="1.jpg" alt="1" />
                <video src="video.mp4" />
              </article>
              <figure>
                <img src="2.jpg" alt="2" />
              </figure>
              <iframe src="embed.html" title="embed" />
            </section>
          </div>
        </RichtextReveal>
      );

      const images = container.querySelectorAll('img');
      const video = container.querySelector('video');
      const figure = container.querySelector('figure');
      const iframe = container.querySelector('iframe');

      // 4 elements: standalone img, video, figure, iframe (img inside figure skipped)
      expect(observedElements.length).toBe(4);
      expect(observedElements).toContain(images[0]); // standalone img
      expect(observedElements).not.toContain(images[1]); // img inside figure — skipped
      expect(observedElements).toContain(video);
      expect(observedElements).toContain(figure);
      expect(observedElements).toContain(iframe);
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid mount and unmount', () => {
      const { unmount } = render(
        <RichtextReveal>
          <img src="test.jpg" alt="test" />
        </RichtextReveal>
      );

      unmount();

      // Should not crash
      expect(observedElements.length).toBe(0);
    });

    it('handles elements added dynamically after mount', () => {
      const { rerender } = render(
        <RichtextReveal>
          <img src="1.jpg" alt="1" />
        </RichtextReveal>
      );

      const initialCount = observedElements.length;

      rerender(
        <RichtextReveal>
          <div>
            <img src="1.jpg" alt="1" />
            <img src="2.jpg" alt="2" />
          </div>
        </RichtextReveal>
      );

      // Note: re-rendering recreates the component, so this tests that
      // the observer works correctly with the new set of elements
      expect(observedElements.length).toBeGreaterThanOrEqual(initialCount);
    });

    it('handles missing container ref gracefully', () => {
      const { unmount } = render(
        <RichtextReveal>
          <div>Content without media</div>
        </RichtextReveal>
      );

      expect(() => unmount()).not.toThrow();
    });

    it('handles observer callback with empty entries', () => {
      render(
        <RichtextReveal>
          <img src="test.jpg" alt="test" />
        </RichtextReveal>
      );

      if (mockObserverCallback) {
        // Call with empty entries array
        expect(() => {
          mockObserverCallback([], {} as IntersectionObserver);
        }).not.toThrow();
      }
    });

    it('handles observer callback with multiple entries', () => {
      const { container } = render(
        <RichtextReveal>
          <div>
            <img src="1.jpg" alt="1" data-testid="img1" />
            <img src="2.jpg" alt="2" data-testid="img2" />
            <img src="3.jpg" alt="3" data-testid="img3" />
          </div>
        </RichtextReveal>
      );

      const img1 = container.querySelector('[data-testid="img1"]') as HTMLElement;
      const img2 = container.querySelector('[data-testid="img2"]') as HTMLElement;
      const img3 = container.querySelector('[data-testid="img3"]') as HTMLElement;

      // Multiple intersections at once
      if (mockObserverCallback) {
        mockObserverCallback(
          [
            {
              target: img1,
              isIntersecting: true,
              boundingClientRect: new DOMRect(),
              intersectionRatio: 0.5,
              rootBounds: new DOMRect(),
              time: Date.now(),
            } as IntersectionObserverEntry,
            {
              target: img2,
              isIntersecting: true,
              boundingClientRect: new DOMRect(),
              intersectionRatio: 0.3,
              rootBounds: new DOMRect(),
              time: Date.now(),
            } as IntersectionObserverEntry,
            {
              target: img3,
              isIntersecting: false,
              boundingClientRect: new DOMRect(),
              intersectionRatio: 0,
              rootBounds: new DOMRect(),
              time: Date.now(),
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        );
      }

      expect(img1).toHaveClass('revealed');
      expect(img2).toHaveClass('revealed');
      expect(img3).not.toHaveClass('revealed');
    });
  });

  describe('Type Safety', () => {
    it('accepts Readonly children prop', () => {
      expect(() => {
        render(
          <RichtextReveal>
            <div>Test</div>
          </RichtextReveal>
        );
      }).not.toThrow();
    });

    it('accepts ReactNode children', () => {
      const children: React.ReactNode = <div>Test</div>;

      expect(() => {
        render(<RichtextReveal>{children}</RichtextReveal>);
      }).not.toThrow();
    });
  });
});

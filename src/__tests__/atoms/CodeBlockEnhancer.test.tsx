import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrictMode } from 'react';
import { render, act } from '@testing-library/react';
import CodeBlockEnhancer from '@/components/atoms/CodeBlockEnhancer';

let disconnectCalls = 0;
let lastObserver: MockResizeObserver | null = null;

class MockResizeObserver implements ResizeObserver {
  callback: ResizeObserverCallback;
  observed: Element[] = [];

  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
    lastObserver = this;
  }

  observe(target: Element): void {
    this.observed.push(target);
  }
  unobserve(): void {}
  disconnect(): void {
    disconnectCalls += 1;
  }

  // Helper for tests to simulate a resize event
  trigger(): void {
    const entries = this.observed.map(
      (target) => ({ target, contentRect: {} as DOMRectReadOnly }) as ResizeObserverEntry
    );
    this.callback(entries, this);
  }
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

const SHIKI_HTML = `<pre class="shiki"><code>const a = 1;\nconst b = 2;</code></pre>`;
const TWO_BLOCKS_HTML = `${SHIKI_HTML}<pre class="shiki"><code>console.log('hi');</code></pre>`;

const stubScrollHeight = (value: number) => {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get: () => value,
  });
};

const renderWithCode = (html: string, scrollHeight = 0) => {
  stubScrollHeight(scrollHeight);
  return render(
    <CodeBlockEnhancer>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </CodeBlockEnhancer>
  );
};

describe('CodeBlockEnhancer', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    disconnectCalls = 0;
    lastObserver = null;
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Copy button injection', () => {
    it('injects a copy button on each pre.shiki', () => {
      const { container } = renderWithCode(TWO_BLOCKS_HTML, 100);
      const buttons = container.querySelectorAll('[data-copy-btn]');
      expect(buttons).toHaveLength(2);
    });

    it('marks pre as enhanced (idempotency marker)', () => {
      const { container } = renderWithCode(SHIKI_HTML, 100);
      const pre = container.querySelector('pre.shiki') as HTMLPreElement;
      expect(pre.dataset.enhanced).toBe('true');
    });

    it('does not duplicate buttons under StrictMode (idempotency)', () => {
      stubScrollHeight(100);
      const { container } = render(
        <StrictMode>
          <CodeBlockEnhancer>
            <div dangerouslySetInnerHTML={{ __html: SHIKI_HTML }} />
          </CodeBlockEnhancer>
        </StrictMode>
      );
      const buttons = container.querySelectorAll('[data-copy-btn]');
      expect(buttons).toHaveLength(1);
    });
  });

  describe('Copy interaction', () => {
    it('calls clipboard.writeText with code text on click', async () => {
      const { container } = renderWithCode(SHIKI_HTML, 100);
      const btn = container.querySelector('[data-copy-btn]') as HTMLButtonElement;
      await act(async () => {
        btn.click();
      });
      expect(writeTextMock).toHaveBeenCalledWith('const a = 1;\nconst b = 2;');
    });

    it('shows "Copied!" then reverts to "Copy" after 1500ms', async () => {
      vi.useFakeTimers();
      const { container } = renderWithCode(SHIKI_HTML, 100);
      const btn = container.querySelector('[data-copy-btn]') as HTMLButtonElement;
      const label = btn.querySelector('[data-copy-label]') as HTMLSpanElement;

      expect(label.textContent).toBe('Copy');

      await act(async () => {
        btn.click();
        await Promise.resolve();
      });
      expect(btn.dataset.state).toBe('success');
      expect(label.textContent).toBe('Copied!');

      await act(async () => {
        vi.advanceTimersByTime(1500);
      });
      expect(btn.dataset.state).toBe('idle');
      expect(label.textContent).toBe('Copy');
    });

    it('shows "Copy failed" when writeText rejects', async () => {
      writeTextMock.mockRejectedValueOnce(new Error('denied'));
      const { container } = renderWithCode(SHIKI_HTML, 100);
      const btn = container.querySelector('[data-copy-btn]') as HTMLButtonElement;
      const label = btn.querySelector('[data-copy-label]') as HTMLSpanElement;

      await act(async () => {
        btn.click();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(btn.dataset.state).toBe('error');
      expect(label.textContent).toBe('Copy failed');
    });
  });

  describe('Collapse threshold', () => {
    it('does not inject fade or toggle when scrollHeight ≤ 600', () => {
      const { container } = renderWithCode(SHIKI_HTML, 500);
      expect(container.querySelector('[data-fade]')).toBeNull();
      expect(container.querySelector('[data-toggle-btn]')).toBeNull();
      const pre = container.querySelector('pre.shiki') as HTMLPreElement;
      expect(pre.dataset.collapsible).toBeUndefined();
    });

    it('injects fade and toggle when scrollHeight > 600', () => {
      const { container } = renderWithCode(SHIKI_HTML, 800);
      expect(container.querySelector('[data-fade]')).not.toBeNull();
      expect(container.querySelector('[data-toggle-btn]')).not.toBeNull();
      const pre = container.querySelector('pre.shiki') as HTMLPreElement;
      expect(pre.dataset.collapsible).toBe('true');
      expect(pre.dataset.collapsed).toBe('true');
      expect(pre.style.getPropertyValue('--code-expanded-h')).toBe('800px');
    });

    it('toggle button contains both icon and label slots', () => {
      const { container } = renderWithCode(SHIKI_HTML, 800);
      const toggle = container.querySelector('[data-toggle-btn]') as HTMLButtonElement;
      expect(toggle.querySelector('[data-toggle-icon]')).not.toBeNull();
      expect(toggle.querySelector('[data-toggle-label]')).not.toBeNull();
      expect(toggle.querySelector('[data-toggle-icon] svg')).not.toBeNull();
    });
  });

  describe('Toggle interaction', () => {
    it('flips data-collapsed and label on toggle click', () => {
      const { container } = renderWithCode(SHIKI_HTML, 800);
      const pre = container.querySelector('pre.shiki') as HTMLPreElement;
      const toggle = container.querySelector('[data-toggle-btn]') as HTMLButtonElement;
      const label = toggle.querySelector('[data-toggle-label]') as HTMLSpanElement;

      expect(pre.dataset.collapsed).toBe('true');
      expect(label.textContent).toBe('Expand');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');

      act(() => {
        toggle.click();
      });

      expect(pre.dataset.collapsed).toBe('false');
      expect(label.textContent).toBe('Collapse');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');

      act(() => {
        toggle.click();
      });

      expect(pre.dataset.collapsed).toBe('true');
      expect(label.textContent).toBe('Expand');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('swaps chevron icon between collapsed (down) and expanded (up) states', () => {
      const { container } = renderWithCode(SHIKI_HTML, 800);
      const toggle = container.querySelector('[data-toggle-btn]') as HTMLButtonElement;
      const icon = toggle.querySelector('[data-toggle-icon]') as HTMLSpanElement;

      // Collapsed: chevron points down (expand affordance)
      const collapsedSvg = icon.innerHTML;
      expect(collapsedSvg).toContain('<svg');
      expect(collapsedSvg).toContain('M19.5 5.25l-7.5 7.5-7.5-7.5');

      act(() => {
        toggle.click();
      });

      // Expanded: chevron points up (collapse affordance)
      const expandedSvg = icon.innerHTML;
      expect(expandedSvg).toContain('M4.5 12.75l7.5-7.5 7.5 7.5');
      expect(expandedSvg).not.toBe(collapsedSvg);

      act(() => {
        toggle.click();
      });

      // Back to chevron down
      expect(icon.innerHTML).toBe(collapsedSvg);
    });
  });

  describe('Cleanup', () => {
    it('disconnects ResizeObserver and removes click listener on unmount', () => {
      const { unmount, container } = renderWithCode(SHIKI_HTML, 800);
      const toggle = container.querySelector('[data-toggle-btn]') as HTMLButtonElement;
      const pre = container.querySelector('pre.shiki') as HTMLPreElement;
      const before = pre.dataset.collapsed;

      unmount();

      expect(disconnectCalls).toBeGreaterThan(0);
      // After unmount the listener is gone — clicking should not change state
      toggle.click();
      expect(pre.dataset.collapsed).toBe(before);
    });
  });

  describe('Accessibility', () => {
    it('copy button has aria-label and type=button', () => {
      const { container } = renderWithCode(SHIKI_HTML, 100);
      const btn = container.querySelector('[data-copy-btn]') as HTMLButtonElement;
      expect(btn.getAttribute('type')).toBe('button');
      expect(btn.getAttribute('aria-label')).toBe('Copy code to clipboard');
    });

    it('toggle button has aria-expanded and type=button', () => {
      const { container } = renderWithCode(SHIKI_HTML, 800);
      const toggle = container.querySelector('[data-toggle-btn]') as HTMLButtonElement;
      expect(toggle.getAttribute('type')).toBe('button');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('copy button exposes a tooltip via data-tooltip and updates on state change', async () => {
      vi.useFakeTimers();
      const { container } = renderWithCode(SHIKI_HTML, 100);
      const btn = container.querySelector('[data-copy-btn]') as HTMLButtonElement;

      expect(btn.dataset.tooltip).toBe('Copy code to clipboard');

      await act(async () => {
        btn.click();
        await Promise.resolve();
      });
      expect(btn.dataset.tooltip).toBe('Copied to clipboard');

      await act(async () => {
        vi.advanceTimersByTime(1500);
      });
      expect(btn.dataset.tooltip).toBe('Copy code to clipboard');
    });
  });

  describe('Edge cases', () => {
    it('renders nothing pre.shiki when content has no code blocks', () => {
      const { container } = renderWithCode('<p>just text</p>', 100);
      expect(container.querySelector('[data-copy-btn]')).toBeNull();
    });

    it('handles missing children gracefully', () => {
      stubScrollHeight(0);
      expect(() => render(<CodeBlockEnhancer>{null}</CodeBlockEnhancer>)).not.toThrow();
    });
  });

  describe('ResizeObserver behavior', () => {
    it('promotes a non-collapsible block to collapsible when resize grows past threshold', () => {
      // Initial render with short height — no collapse affordances
      const { container } = renderWithCode(SHIKI_HTML, 400);
      const pre = container.querySelector('pre.shiki') as HTMLPreElement;
      expect(pre.dataset.collapsible).toBeUndefined();
      expect(container.querySelector('[data-toggle-btn]')).toBeNull();

      // Simulate a resize: scrollHeight grows past threshold, observer fires
      stubScrollHeight(900);
      act(() => {
        lastObserver?.trigger();
      });

      expect(pre.dataset.collapsible).toBe('true');
      expect(pre.dataset.collapsed).toBe('true');
      expect(container.querySelector('[data-toggle-btn]')).not.toBeNull();
      expect(container.querySelector('[data-fade]')).not.toBeNull();
    });

    it('reverts a collapsible block when resize shrinks back under threshold', () => {
      // Initial render tall enough to be collapsible
      const { container } = renderWithCode(SHIKI_HTML, 800);
      const pre = container.querySelector('pre.shiki') as HTMLPreElement;
      expect(pre.dataset.collapsible).toBe('true');
      expect(container.querySelector('[data-toggle-btn]')).not.toBeNull();
      expect(container.querySelector('[data-fade]')).not.toBeNull();

      // Simulate shrink under threshold — affordances must be removed
      stubScrollHeight(300);
      act(() => {
        lastObserver?.trigger();
      });

      expect(pre.dataset.collapsible).toBe('false');
      expect(pre.dataset.collapsed).toBe('false');
      expect(container.querySelector('[data-toggle-btn]')).toBeNull();
      expect(container.querySelector('[data-fade]')).toBeNull();
    });

    it('does not create a ResizeObserver when global is undefined', () => {
      const original = global.ResizeObserver;
      // @ts-expect-error - intentionally remove for graceful-degradation test
      delete global.ResizeObserver;

      try {
        const { container, unmount } = renderWithCode(SHIKI_HTML, 800);
        // Component still enhances pre / injects affordances on first eval
        expect(container.querySelector('[data-copy-btn]')).not.toBeNull();
        // Unmount should not throw even when no observer was created
        expect(() => unmount()).not.toThrow();
      } finally {
        global.ResizeObserver = original;
      }
    });
  });
});

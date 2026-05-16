import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  setCopyButtonState,
  evaluateCollapsible,
  enhancePre,
  toggleCollapsed,
  copyPreContent,
  LABELS,
  TOOLTIPS,
  ICONS,
  COLLAPSE_THRESHOLD_PX,
} from '@/lib/code-block-dom';

// ============================================================================
// Helpers
// ============================================================================

function makeCopyButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.dataset.copyBtn = '';
  btn.dataset.state = 'idle';
  btn.dataset.tooltip = TOOLTIPS.idle;
  btn.innerHTML = `<span data-copy-icon>${ICONS.copy}</span><span data-copy-label>${LABELS.idle}</span>`;
  return btn;
}

function makeToggleButton(): HTMLButtonElement {
  const toggle = document.createElement('button');
  toggle.dataset.toggleBtn = '';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = `<span data-toggle-icon>${ICONS.chevronDown}</span><span data-toggle-label>${LABELS.expand}</span>`;
  return toggle;
}

function makePre(scrollHeight = 0, withCode = true): HTMLPreElement {
  const pre = document.createElement('pre');
  pre.className = 'shiki';
  if (withCode) {
    const code = document.createElement('code');
    code.textContent = 'const x = 1;';
    pre.appendChild(code);
  }
  Object.defineProperty(pre, 'scrollHeight', { configurable: true, get: () => scrollHeight });
  document.body.appendChild(pre);
  return pre;
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ============================================================================
// setCopyButtonState
// ============================================================================

describe('setCopyButtonState', () => {
  it('returns early when label element is missing', () => {
    const btn = document.createElement('button');
    // No child elements — should not throw
    expect(() => setCopyButtonState(btn, 'success')).not.toThrow();
    // dataset.state should remain unchanged
    expect(btn.dataset.state).toBeUndefined();
  });

  it('returns early when icon element is missing (label present, icon absent)', () => {
    const btn = document.createElement('button');
    btn.innerHTML = '<span data-copy-label>Copy</span>'; // no [data-copy-icon]
    expect(() => setCopyButtonState(btn, 'success')).not.toThrow();
    expect(btn.dataset.state).toBeUndefined();
  });

  it('updates to success state', () => {
    const btn = makeCopyButton();
    setCopyButtonState(btn, 'success');
    expect(btn.dataset.state).toBe('success');
    expect(btn.dataset.tooltip).toBe(TOOLTIPS.success);
    expect(btn.querySelector<HTMLElement>('[data-copy-label]')!.textContent).toBe(LABELS.success);
  });

  it('updates to error state', () => {
    const btn = makeCopyButton();
    setCopyButtonState(btn, 'error');
    expect(btn.dataset.state).toBe('error');
    expect(btn.dataset.tooltip).toBe(TOOLTIPS.error);
    expect(btn.querySelector<HTMLElement>('[data-copy-label]')!.textContent).toBe(LABELS.error);
  });

  it('updates to idle state', () => {
    const btn = makeCopyButton();
    setCopyButtonState(btn, 'idle');
    expect(btn.dataset.state).toBe('idle');
    expect(btn.dataset.tooltip).toBe(TOOLTIPS.idle);
    expect(btn.querySelector<HTMLElement>('[data-copy-label]')!.textContent).toBe(LABELS.idle);
  });
});

// ============================================================================
// evaluateCollapsible
// ============================================================================

describe('evaluateCollapsible', () => {
  it('injects collapse affordances when scrollHeight > threshold', () => {
    const pre = makePre(COLLAPSE_THRESHOLD_PX + 1);
    evaluateCollapsible(pre);

    expect(pre.dataset.collapsible).toBe('true');
    expect(pre.dataset.collapsed).toBe('true');
    expect(pre.querySelector('[data-fade]')).not.toBeNull();
    expect(pre.querySelector('[data-toggle-btn]')).not.toBeNull();
  });

  it('does not re-inject affordances when already collapsible', () => {
    const pre = makePre(COLLAPSE_THRESHOLD_PX + 1);
    evaluateCollapsible(pre);
    evaluateCollapsible(pre); // second call — idempotent

    expect(pre.querySelectorAll('[data-toggle-btn]')).toHaveLength(1);
  });

  it('removes collapse affordances when shrinking below threshold', () => {
    const pre = makePre(COLLAPSE_THRESHOLD_PX + 1);
    evaluateCollapsible(pre);
    expect(pre.dataset.collapsible).toBe('true');

    // Shrink below threshold
    Object.defineProperty(pre, 'scrollHeight', { configurable: true, get: () => 100 });
    evaluateCollapsible(pre);

    expect(pre.dataset.collapsible).toBe('false');
    expect(pre.dataset.collapsed).toBe('false');
    expect(pre.querySelector('[data-fade]')).toBeNull();
    expect(pre.querySelector('[data-toggle-btn]')).toBeNull();
  });

  it('does nothing when below threshold and not previously collapsible', () => {
    const pre = makePre(100);
    evaluateCollapsible(pre);

    expect(pre.dataset.collapsible).toBeUndefined();
    expect(pre.dataset.collapsed).toBeUndefined();
  });

  it('skips re-appending fade/toggle when they already exist in pre (false branch of lines 89-90)', () => {
    // Pre has affordances already but collapsible is not set — exercises the
    // if (!pre.querySelector('[data-fade]')) false branch inside injectCollapseAffordances
    const pre = makePre(COLLAPSE_THRESHOLD_PX + 1);
    // Manually inject both affordances without setting dataset.collapsible
    const fade = document.createElement('div');
    fade.dataset.fade = '';
    pre.appendChild(fade);
    const toggleBtn = document.createElement('button');
    toggleBtn.dataset.toggleBtn = '';
    pre.appendChild(toggleBtn);

    evaluateCollapsible(pre);

    // Should still set collapsible data and not duplicate elements
    expect(pre.dataset.collapsible).toBe('true');
    expect(pre.querySelectorAll('[data-fade]')).toHaveLength(1);
    expect(pre.querySelectorAll('[data-toggle-btn]')).toHaveLength(1);
  });
});

// ============================================================================
// enhancePre
// ============================================================================

describe('enhancePre', () => {
  it('marks pre as enhanced and adds copy button', () => {
    const pre = makePre(100);
    enhancePre(pre);

    expect(pre.dataset.enhanced).toBe('true');
    expect(pre.querySelector('[data-copy-btn]')).not.toBeNull();
  });

  it('is idempotent — does not double-enhance', () => {
    const pre = makePre(100);
    enhancePre(pre);
    enhancePre(pre);

    expect(pre.querySelectorAll('[data-copy-btn]')).toHaveLength(1);
  });
});

// ============================================================================
// toggleCollapsed
// ============================================================================

describe('toggleCollapsed', () => {
  it('does nothing when button has no ancestor pre.shiki', () => {
    const btn = makeToggleButton();
    document.body.appendChild(btn);
    expect(() => toggleCollapsed(btn)).not.toThrow();
  });

  it('toggles collapsed state from true to false', () => {
    const pre = makePre(COLLAPSE_THRESHOLD_PX + 1);
    const toggle = makeToggleButton();
    pre.appendChild(toggle);
    pre.dataset.collapsed = 'true';

    toggleCollapsed(toggle);

    expect(pre.dataset.collapsed).toBe('false');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const label = toggle.querySelector<HTMLElement>('[data-toggle-label]')!;
    expect(label.textContent).toBe(LABELS.collapse);
  });

  it('toggles collapsed state from false to true', () => {
    const pre = makePre(COLLAPSE_THRESHOLD_PX + 1);
    const toggle = makeToggleButton();
    pre.appendChild(toggle);
    pre.dataset.collapsed = 'false';

    toggleCollapsed(toggle);

    expect(pre.dataset.collapsed).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const label = toggle.querySelector<HTMLElement>('[data-toggle-label]')!;
    expect(label.textContent).toBe(LABELS.expand);
  });

  it('does not throw when toggle button has no label or icon children (lines 132-133 false branch)', () => {
    const pre = makePre(COLLAPSE_THRESHOLD_PX + 1);
    // Create a minimal toggle button without label/icon spans
    const toggle = document.createElement('button');
    toggle.dataset.toggleBtn = '';
    toggle.setAttribute('aria-expanded', 'false');
    pre.appendChild(toggle);
    pre.dataset.collapsed = 'true';

    // Should not throw despite missing child elements
    expect(() => toggleCollapsed(toggle)).not.toThrow();
    expect(pre.dataset.collapsed).toBe('false');
  });
});

// ============================================================================
// copyPreContent
// ============================================================================

describe('copyPreContent', () => {
  it('returns "idle" when button has no ancestor pre.shiki', async () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    const result = await copyPreContent(btn);
    expect(result).toBe('idle');
  });

  it('returns "idle" when pre has no code element', async () => {
    const pre = makePre(100, false);
    const btn = document.createElement('button');
    btn.dataset.copyBtn = '';
    pre.appendChild(btn);

    const result = await copyPreContent(btn);
    expect(result).toBe('idle');
  });

  it('returns "success" when clipboard.writeText resolves', async () => {
    const pre = makePre(100, true);
    const btn = document.createElement('button');
    btn.dataset.copyBtn = '';
    pre.appendChild(btn);

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    const result = await copyPreContent(btn);
    expect(result).toBe('success');
    expect(writeText).toHaveBeenCalledWith('const x = 1;');
  });

  it('returns "error" when clipboard.writeText rejects', async () => {
    const pre = makePre(100, true);
    const btn = document.createElement('button');
    btn.dataset.copyBtn = '';
    pre.appendChild(btn);

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
      writable: true,
    });

    const result = await copyPreContent(btn);
    expect(result).toBe('error');
  });
});

/**
 * DOM helpers for client-side enhancement of `pre.shiki` code blocks.
 * Pure functions — no React, no module-level state. The component owns
 * lifecycle (event listener, ResizeObserver, debounce timers).
 */

export const COLLAPSE_THRESHOLD_PX = 600;
export const COPY_FEEDBACK_MS = 1500;

const SVG_BASE = `xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;

export const ICONS = {
  copy: `<svg ${SVG_BASE}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  check: `<svg ${SVG_BASE.replace('stroke-width="2"', 'stroke-width="2.5"')}><polyline points="20 6 9 17 4 12"/></svg>`,
  chevronDown: `<svg ${SVG_BASE}><path d="M19.5 5.25l-7.5 7.5-7.5-7.5"/><path d="M19.5 11.25l-7.5 7.5-7.5-7.5"/></svg>`,
  chevronUp: `<svg ${SVG_BASE}><path d="M4.5 12.75l7.5-7.5 7.5 7.5"/><path d="M4.5 18.75l7.5-7.5 7.5 7.5"/></svg>`,
} as const;

export const TOOLTIPS = {
  idle: 'Copy code to clipboard',
  success: 'Copied to clipboard',
  error: 'Copy failed — try again',
} as const;

export const LABELS = {
  idle: 'Copy',
  success: 'Copied!',
  error: 'Copy failed',
  expand: 'Expand',
  collapse: 'Collapse',
} as const;

export type CopyState = 'idle' | 'success' | 'error';

const copyStateConfig = (state: CopyState): { label: string; icon: string; tooltip: string } => {
  switch (state) {
    case 'success':
      return { label: LABELS.success, icon: ICONS.check, tooltip: TOOLTIPS.success };
    case 'error':
      return { label: LABELS.error, icon: ICONS.copy, tooltip: TOOLTIPS.error };
    default:
      return { label: LABELS.idle, icon: ICONS.copy, tooltip: TOOLTIPS.idle };
  }
};

const findPre = (el: HTMLElement): HTMLPreElement | null =>
  el.closest('pre.shiki') as HTMLPreElement | null;

export function setCopyButtonState(btn: HTMLButtonElement, state: CopyState): void {
  const label = btn.querySelector<HTMLElement>('[data-copy-label]');
  const icon = btn.querySelector<HTMLElement>('[data-copy-icon]');
  if (!label || !icon) return;
  const config = copyStateConfig(state);
  btn.dataset.state = state;
  btn.dataset.tooltip = config.tooltip;
  label.textContent = config.label;
  icon.innerHTML = config.icon;
}

function createCopyButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.dataset.copyBtn = '';
  btn.dataset.state = 'idle';
  btn.dataset.tooltip = TOOLTIPS.idle;
  btn.setAttribute('aria-label', TOOLTIPS.idle);
  btn.innerHTML = `<span data-copy-icon>${ICONS.copy}</span><span data-copy-label>${LABELS.idle}</span>`;
  return btn;
}

function createFadeOverlay(): HTMLDivElement {
  const fade = document.createElement('div');
  fade.dataset.fade = '';
  fade.setAttribute('aria-hidden', 'true');
  return fade;
}

function createToggleButton(): HTMLButtonElement {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.dataset.toggleBtn = '';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Toggle code block expansion');
  toggle.innerHTML = `<span data-toggle-icon>${ICONS.chevronDown}</span><span data-toggle-label>${LABELS.expand}</span>`;
  return toggle;
}

function injectCollapseAffordances(pre: HTMLPreElement): void {
  if (!pre.querySelector('[data-fade]')) pre.appendChild(createFadeOverlay());
  if (!pre.querySelector('[data-toggle-btn]')) pre.appendChild(createToggleButton());
}

function removeCollapseAffordances(pre: HTMLPreElement): void {
  pre.querySelector('[data-fade]')?.remove();
  pre.querySelector('[data-toggle-btn]')?.remove();
}

export function evaluateCollapsible(pre: HTMLPreElement): void {
  const height = pre.scrollHeight;
  const wasCollapsible = pre.dataset.collapsible === 'true';
  const shouldCollapse = height > COLLAPSE_THRESHOLD_PX;

  if (shouldCollapse) {
    pre.style.setProperty('--code-expanded-h', `${height}px`);
    if (!wasCollapsible) {
      pre.dataset.collapsible = 'true';
      pre.dataset.collapsed = 'true';
      injectCollapseAffordances(pre);
    }
  } else if (wasCollapsible) {
    pre.dataset.collapsible = 'false';
    pre.dataset.collapsed = 'false';
    removeCollapseAffordances(pre);
  }
}

export function enhancePre(pre: HTMLPreElement): void {
  if (pre.dataset.enhanced === 'true') return;
  pre.dataset.enhanced = 'true';
  pre.appendChild(createCopyButton());
  evaluateCollapsible(pre);
}

export function toggleCollapsed(btn: HTMLButtonElement): void {
  const pre = findPre(btn);
  if (!pre) return;
  const willCollapse = pre.dataset.collapsed !== 'true';
  pre.dataset.collapsed = String(willCollapse);
  btn.setAttribute('aria-expanded', String(!willCollapse));
  const label = btn.querySelector<HTMLElement>('[data-toggle-label]');
  const icon = btn.querySelector<HTMLElement>('[data-toggle-icon]');
  if (label) label.textContent = willCollapse ? LABELS.expand : LABELS.collapse;
  if (icon) icon.innerHTML = willCollapse ? ICONS.chevronDown : ICONS.chevronUp;
}

export async function copyPreContent(btn: HTMLButtonElement): Promise<CopyState> {
  const pre = findPre(btn);
  const code = pre?.querySelector('code');
  if (!pre || !code) return 'idle';
  try {
    await navigator.clipboard.writeText(code.textContent ?? '');
    return 'success';
  } catch {
    return 'error';
  }
}

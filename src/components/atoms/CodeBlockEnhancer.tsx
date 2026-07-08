'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import {
  COPY_FEEDBACK_MS,
  copyAllTabs,
  copyPreContent,
  createCopyAllButton,
  enhancePre,
  evaluateCollapsible,
  setCopyAllButtonState,
  setCopyButtonState,
  toggleCollapsed,
} from '@/lib/code-block-dom';

interface CodeBlockEnhancerProps {
  children: ReactNode;
}

export default function CodeBlockEnhancer({ children }: Readonly<CodeBlockEnhancerProps>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const copyTimers = new WeakMap<HTMLButtonElement, ReturnType<typeof setTimeout>>();

    const handleCopy = async (btn: HTMLButtonElement) => {
      const existing = copyTimers.get(btn);
      if (existing) clearTimeout(existing);

      const state = await copyPreContent(btn);
      setCopyButtonState(btn, state);

      const timer = setTimeout(() => {
        setCopyButtonState(btn, 'idle');
        copyTimers.delete(btn);
      }, COPY_FEEDBACK_MS);
      copyTimers.set(btn, timer);
    };

    const handleCopyAll = async (btn: HTMLButtonElement) => {
      const group = btn.closest<HTMLElement>('.code-tabs');
      if (!group) return;

      const existing = copyTimers.get(btn);
      if (existing) clearTimeout(existing);

      const state = await copyAllTabs(group);
      setCopyAllButtonState(btn, state);

      const timer = setTimeout(() => {
        setCopyAllButtonState(btn, 'idle');
        copyTimers.delete(btn);
      }, COPY_FEEDBACK_MS);
      copyTimers.set(btn, timer);
    };

    const onClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const copyAllBtn = target.closest<HTMLButtonElement>('[data-copy-all-btn]');
      if (copyAllBtn) {
        void handleCopyAll(copyAllBtn);
        return;
      }

      const copyBtn = target.closest<HTMLButtonElement>('[data-copy-btn]');
      if (copyBtn) {
        void handleCopy(copyBtn);
        return;
      }

      const toggleBtn = target.closest<HTMLButtonElement>('[data-toggle-btn]');
      if (toggleBtn) toggleCollapsed(toggleBtn);
    };

    const pres = Array.from(container.querySelectorAll<HTMLPreElement>('pre.shiki'));
    pres.forEach(enhancePre);

    // Inject a single "copy all files" control per code_tabs group. Bare
    // markdown/richtext blocks have no `.code-tabs`, so they keep per-block copy
    // only. Guard is container-level (RT#15) because Strict Mode / live-preview
    // re-runs this effect and the `pre`-scoped `data-enhanced` flag won't catch it.
    const group = container.querySelector<HTMLElement>('.code-tabs');
    if (group && !group.querySelector('[data-copy-all-btn]')) {
      group.appendChild(createCopyAllButton());
    }

    container.addEventListener('click', onClick);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) evaluateCollapsible(entry.target as HTMLPreElement);
      });
      pres.forEach((pre) => observer?.observe(pre));
    }

    return () => {
      container.removeEventListener('click', onClick);
      observer?.disconnect();
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}

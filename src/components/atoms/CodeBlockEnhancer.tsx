'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import {
  COPY_FEEDBACK_MS,
  copyPreContent,
  enhancePre,
  evaluateCollapsible,
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

    const onClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

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

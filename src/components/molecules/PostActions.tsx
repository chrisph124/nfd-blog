"use client";

import { useEffect, useId, useRef, useState, type FocusEvent } from 'react';
import type { IconType } from 'react-icons';
import {
  FaEllipsis,
  FaFacebookF,
  FaLink,
  FaLinkedinIn,
  FaMarkdown,
  FaRegCopy,
  FaShareNodes,
  FaWhatsapp,
  FaXTwitter,
} from 'react-icons/fa6';
import { cn } from '@/lib/utils';

interface PostActionsProps {
  /** Absolute canonical URL of the post; its Markdown twin lives at `${url}.md`. */
  url: string;
  title: string;
  /** `center` under the title, `start` at the end of the post, aligned with the body text. */
  align?: 'center' | 'start';
}

interface Status {
  text: string;
  /** Changes on every message so a repeated text is announced again and restarts the clear timer. */
  id: number;
}

interface ShareTarget {
  name: string;
  icon: IconType;
  buildUrl: (url: string, title: string) => string;
}

const SHARE_TARGETS: ShareTarget[] = [
  {
    name: 'LinkedIn',
    icon: FaLinkedinIn,
    buildUrl: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'X',
    icon: FaXTwitter,
    buildUrl: (url, title) => `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: 'Facebook',
    icon: FaFacebookF,
    buildUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'WhatsApp',
    icon: FaWhatsapp,
    buildUrl: (url, title) => `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
  },
];

const STATUS_CLEAR_MS = 4000;
// Short enough to stay on one line at 360px, so a failure never shifts the layout.
const COPY_FAILED = 'Copy failed. Select the text and copy it.';

// `!` beats the unlayered global `a:not(...)` link color and underline rule.
const CONTROL_CLASSES =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold text-foreground! no-underline! transition-colors hover:bg-gray-100 hover:text-primary-700! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700';
const ICON_CONTROL_CLASSES = `${CONTROL_CLASSES} min-w-11`;
const TEXT_CONTROL_CLASSES = `${CONTROL_CLASSES} px-3`;

const ITEM_CLASSES =
  'flex w-full min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground! no-underline! hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-700';

const ICON_CLASSES = 'h-4 w-4 shrink-0';

const CENTER_CLASSES = { wrapper: 'items-center', row: 'justify-center', status: 'text-center' };
// The negative margin lines the first icon up with the body text instead of its 44px hit area.
const START_CLASSES = { wrapper: 'items-start', row: 'justify-start -ml-3.5', status: 'text-left' };

// Phones and tablets list the apps that are actually installed in their native sheet; desktops get the menu.
const prefersNativeShare = () =>
  typeof navigator.share === 'function' && Boolean(window.matchMedia?.('(pointer: coarse)').matches);

export default function PostActions({ url, title, align = 'center' }: Readonly<PostActionsProps>) {
  const [status, setStatus] = useState<Status | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const alignClasses = align === 'start' ? START_CLASSES : CENTER_CLASSES;

  const mdUrl = `${url}.md`;
  const mdPath = `${new URL(url).pathname}.md`;
  const prompt = `Read ${mdUrl} and answer questions about it.`;

  const announce = (text: string) => setStatus((previous) => ({ text, id: (previous?.id ?? 0) + 1 }));

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), STATUS_CLEAR_MS);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!menuOpen) return;
    // Safari does not focus a clicked button, so blur alone cannot close the menu on an outside click.
    const onPointerDown = (event: PointerEvent) => {
      if (!shareRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      if (shareRef.current?.contains(document.activeElement)) shareButtonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  // The write starts inside the click handler, as browsers require; the async wrapper turns a
  // missing clipboard API into a rejection instead of an uncaught error.
  const copy = (text: string, done: string) => {
    (async () => navigator.clipboard.writeText(text))().then(
      () => announce(done),
      () => announce(COPY_FAILED),
    );
  };

  // Hiding the menu would drop focus on <body>, so items hand it back to the Share button.
  const closeMenu = () => {
    setMenuOpen(false);
    shareButtonRef.current?.focus();
  };

  const closeWhenFocusLeaves = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
  };

  const openNativeShare = () => {
    navigator.share({ title, url }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setCanNativeShare(false);
      setMenuOpen(true);
    });
  };

  const onShareClick = () => {
    if (prefersNativeShare()) {
      openNativeShare();
      return;
    }
    setCanNativeShare(typeof navigator.share === 'function');
    setMenuOpen((isOpen) => !isOpen);
  };

  return (
    <div className={cn('flex flex-col gap-1', alignClasses.wrapper)}>
      <div className={cn('flex flex-wrap items-center gap-1', alignClasses.row)}>
        <div ref={shareRef} onBlur={closeWhenFocusLeaves} className="relative">
          <button
            ref={shareButtonRef}
            type="button"
            aria-label="Share"
            title="Share"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            className={ICON_CONTROL_CLASSES}
            onClick={onShareClick}
          >
            <FaShareNodes aria-hidden="true" className={ICON_CLASSES} />
          </button>

          <ul
            id={menuId}
            hidden={!menuOpen}
            className="absolute left-0 top-full z-30 mt-2 w-56 rounded-xl border border-gray-200 bg-background p-2 text-left shadow-lg"
          >
            <li>
              <button
                type="button"
                className={ITEM_CLASSES}
                onClick={() => {
                  closeMenu();
                  copy(url, 'Link copied');
                }}
              >
                <FaLink aria-hidden="true" className={ICON_CLASSES} />
                Copy link
              </button>
            </li>
            {SHARE_TARGETS.map(({ name, icon: Icon, buildUrl }) => (
              <li key={name}>
                <a
                  href={buildUrl(url, title)}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className={ITEM_CLASSES}
                  onClick={closeMenu}
                >
                  <Icon aria-hidden="true" className={ICON_CLASSES} />
                  {name}
                </a>
              </li>
            ))}
            {canNativeShare && (
              <li>
                <button
                  type="button"
                  className={ITEM_CLASSES}
                  onClick={() => {
                    closeMenu();
                    openNativeShare();
                  }}
                >
                  <FaEllipsis aria-hidden="true" className={ICON_CLASSES} />
                  More apps…
                </button>
              </li>
            )}
          </ul>
        </div>

        <a
          href={mdPath}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View as Markdown"
          title="View as Markdown"
          className={ICON_CONTROL_CLASSES}
        >
          <FaMarkdown aria-hidden="true" className={ICON_CLASSES} />
        </a>

        <button type="button" className={TEXT_CONTROL_CLASSES} onClick={() => copy(prompt, 'Prompt copied')}>
          <FaRegCopy aria-hidden="true" className={ICON_CLASSES} />
          Copy prompt
        </button>
      </div>

      {/* Reserved height keeps the status line from shifting the layout when a message appears. */}
      <p role="status" aria-live="polite" className={cn('min-h-5 text-sm text-gray-500', alignClasses.status)}>
        {status && <span key={status.id}>{status.text}</span>}
      </p>
    </div>
  );
}

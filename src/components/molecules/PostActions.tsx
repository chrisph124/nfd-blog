"use client";

import { useEffect, useId, useRef, useState, type FocusEvent } from 'react';
import { FaChevronDown, FaExternalLinkAlt, FaLink, FaMarkdown, FaRegCopy, FaShareAlt } from 'react-icons/fa';
import { cn } from '@/lib/utils';

interface PostActionsProps {
  /** Absolute canonical URL of the post; its Markdown twin lives at `${url}.md`. */
  url: string;
  title: string;
}

interface AiProvider {
  name: string;
  /** Takes the URL-encoded prompt. Providers without one get the prompt copied, then `homeUrl` opens. */
  prefillUrl?: string;
  homeUrl: string;
}

interface Status {
  text: string;
  /** Changes on every message so a repeated text is announced again and restarts the clear timer. */
  id: number;
}

const AI_PROVIDERS: AiProvider[] = [
  { name: 'ChatGPT', prefillUrl: 'https://chatgpt.com/?q=', homeUrl: 'https://chatgpt.com/' },
  { name: 'Claude', prefillUrl: 'https://claude.ai/new?q=', homeUrl: 'https://claude.ai/new' },
  { name: 'Perplexity', prefillUrl: 'https://www.perplexity.ai/search/new?q=', homeUrl: 'https://www.perplexity.ai/' },
  { name: 'Grok', prefillUrl: 'https://grok.com/?q=', homeUrl: 'https://grok.com/' },
  { name: 'Gemini', homeUrl: 'https://gemini.google.com/app' },
];

const STATUS_CLEAR_MS = 4000;
// Short enough to stay on one line at 360px, so a failure never shifts the layout.
const COPY_FAILED = 'Copy failed. Select the text and copy it.';
const SHARE_FAILED = 'Share failed. Use Copy link instead.';

const BUTTON_CLASSES =
  'inline-flex min-h-11 items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary-700 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700';

// `!` beats the unlayered global `a:not(...)` link color and underline rule.
const ITEM_CLASSES =
  'flex w-full min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground! no-underline! hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-700';

const ICON_CLASSES = 'h-4 w-4 shrink-0';

async function copyMarkdown(mdPath: string): Promise<void> {
  const text = fetch(mdPath).then((res) => {
    if (!res.ok) throw new Error(`Markdown request failed: ${res.status}`);
    return res.text();
  });

  // Safari keeps the click's user activation only when the write starts synchronously, so it gets a pending blob.
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      const blob = text.then((body) => new Blob([body], { type: 'text/plain' }));
      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
      return;
    } catch {
      // Fall back to writeText below; a failed fetch rejects there too.
    }
  }
  await navigator.clipboard.writeText(await text);
}

export default function PostActions({ url, title }: Readonly<PostActionsProps>) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

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
    if (!open) return;
    // Safari does not focus a clicked button, so blur alone cannot close the menu on an outside click.
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      if (containerRef.current?.contains(document.activeElement)) toggleRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Hiding the menu would drop focus on <body>, so items hand it back to the toggle.
  const closeMenu = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  const closeWhenFocusLeaves = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  };

  // Clipboard writes must start inside the click handler, so `action` runs synchronously;
  // async actions turn a missing clipboard API into a rejection instead of an uncaught error.
  const run = (action: () => Promise<void>, done: string) => {
    action().then(
      () => announce(done),
      () => announce(COPY_FAILED),
    );
  };

  const copyLink = () => run(async () => navigator.clipboard.writeText(url), 'Link copied');

  // The tab opens only after the copy succeeds, so the user never pastes a stale clipboard.
  // `noopener` would make window.open return null, so the opener is cut by hand to detect a blocked tab.
  const openWithPrompt = (name: string, homeUrl: string) => {
    const copied = (async () => navigator.clipboard.writeText(prompt))();
    copied.then(
      () => {
        const tab = window.open(homeUrl, '_blank');
        if (tab) tab.opener = null;
        announce(tab ? `Prompt copied. Paste it into ${name}.` : `Prompt copied. Open ${name} and paste it.`);
      },
      () => announce(COPY_FAILED),
    );
  };

  const share = () => {
    if (typeof navigator.share !== 'function') {
      copyLink();
      return;
    }
    navigator.share({ title, url }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      announce(SHARE_FAILED);
    });
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={containerRef}
        onBlur={closeWhenFocusLeaves}
        className="relative flex flex-wrap items-center justify-center gap-2"
      >
        <button
          type="button"
          className={BUTTON_CLASSES}
          onClick={() => {
            setOpen(false);
            run(() => copyMarkdown(mdPath), 'Page copied');
          }}
        >
          <FaRegCopy aria-hidden="true" className={ICON_CLASSES} />
          Copy page
        </button>

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          className={BUTTON_CLASSES}
          onClick={() => setOpen((isOpen) => !isOpen)}
        >
          More actions
          <FaChevronDown aria-hidden="true" className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
        </button>

        <ul
          id={menuId}
          hidden={!open}
          className="absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-xl border border-gray-200 bg-background p-2 text-left shadow-lg"
        >
          <li>
            <a href={mdPath} target="_blank" rel="noopener noreferrer" className={ITEM_CLASSES} onClick={closeMenu}>
              <FaMarkdown aria-hidden="true" className={ICON_CLASSES} />
              View as Markdown
            </a>
          </li>
          <li>
            <button
              type="button"
              className={ITEM_CLASSES}
              onClick={() => {
                closeMenu();
                copyLink();
              }}
            >
              <FaLink aria-hidden="true" className={ICON_CLASSES} />
              Copy link
            </button>
          </li>
          {AI_PROVIDERS.map(({ name, prefillUrl, homeUrl }) => (
            <li key={name}>
              {prefillUrl ? (
                <a
                  href={`${prefillUrl}${encodeURIComponent(prompt)}`}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className={ITEM_CLASSES}
                  onClick={closeMenu}
                >
                  <FaExternalLinkAlt aria-hidden="true" className={ICON_CLASSES} />
                  Open in {name}
                </a>
              ) : (
                <button
                  type="button"
                  className={ITEM_CLASSES}
                  onClick={() => {
                    closeMenu();
                    openWithPrompt(name, homeUrl);
                  }}
                >
                  <FaRegCopy aria-hidden="true" className={ICON_CLASSES} />
                  Copy prompt, open {name}
                </button>
              )}
            </li>
          ))}
          <li>
            <button
              type="button"
              className={ITEM_CLASSES}
              onClick={() => {
                closeMenu();
                share();
              }}
            >
              <FaShareAlt aria-hidden="true" className={ICON_CLASSES} />
              Share
            </button>
          </li>
        </ul>
      </div>

      {/* Reserved height keeps the status line from shifting the layout when a message appears. */}
      <p role="status" aria-live="polite" className="min-h-5 text-center text-sm text-gray-500">
        {status && <span key={status.id}>{status.text}</span>}
      </p>
    </div>
  );
}

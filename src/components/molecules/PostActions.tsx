"use client";

import { useEffect, useState } from 'react';
import { FaMarkdown, FaRegCopy, FaShareAlt } from 'react-icons/fa';
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

const STATUS_CLEAR_MS = 4000;
// Short enough to stay on one line at 360px, so a failure never shifts the layout.
const COPY_FAILED = 'Copy failed. Select the text and copy it.';
const SHARE_FAILED = 'Share failed. Copy the address bar instead.';

const CONTROL_CLASSES =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-gray-200 text-sm font-semibold text-foreground! no-underline! transition-colors hover:border-primary-700 hover:text-primary-700! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700';

// `!` on the shared classes beats the unlayered global `a:not(...)` link color and underline rule.
const ICON_CONTROL_CLASSES = `${CONTROL_CLASSES} min-w-11`;
const TEXT_CONTROL_CLASSES = `${CONTROL_CLASSES} px-4 py-2`;

const ICON_CLASSES = 'h-4 w-4 shrink-0';

const CENTER_CLASSES = { wrapper: 'items-center', row: 'justify-center', status: 'text-center' };
const START_CLASSES = { wrapper: 'items-start', row: 'justify-start', status: 'text-left' };

export default function PostActions({ url, title, align = 'center' }: Readonly<PostActionsProps>) {
  const [status, setStatus] = useState<Status | null>(null);
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

  // The write starts inside the click handler, as browsers require; the async wrapper turns a
  // missing clipboard API into a rejection instead of an uncaught error.
  const copy = (text: string, done: string) => {
    (async () => navigator.clipboard.writeText(text))().then(
      () => announce(done),
      () => announce(COPY_FAILED),
    );
  };

  const share = () => {
    if (typeof navigator.share !== 'function') {
      copy(url, 'Link copied');
      return;
    }
    navigator.share({ title, url }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      announce(SHARE_FAILED);
    });
  };

  return (
    <div className={cn('flex flex-col gap-1', alignClasses.wrapper)}>
      <div className={cn('flex flex-wrap items-center gap-2', alignClasses.row)}>
        <button type="button" aria-label="Share" title="Share" className={ICON_CONTROL_CLASSES} onClick={share}>
          <FaShareAlt aria-hidden="true" className={ICON_CLASSES} />
        </button>

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

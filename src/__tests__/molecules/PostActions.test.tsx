import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostActions from '@/components/molecules/PostActions';

const URL_UNDER_TEST = 'https://www.notesof.dev/my-post';
const TITLE = 'My post';
const PROMPT = `Read ${URL_UNDER_TEST}.md and answer questions about it.`;
const encoded = encodeURIComponent(URL_UNDER_TEST);

const stubPointer = (pointer: 'coarse' | 'fine') =>
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === `(pointer: ${pointer})`, media: query }));

describe('PostActions', () => {
  let writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;

  beforeEach(() => {
    writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    stubPointer('fine');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'share');
  });

  // userEvent.setup() installs its own clipboard stub, so ours replaces it afterwards.
  const setup = (clipboard: Partial<Clipboard> = { writeText }) => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
    render(<PostActions url={URL_UNDER_TEST} title={TITLE} />);
    return user;
  };

  const stubNativeShare = (share = vi.fn().mockResolvedValue(undefined)) => {
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    return share;
  };

  it('copies a prompt that points at the absolute Markdown URL', async () => {
    const user = setup();

    await user.click(screen.getByRole('button', { name: 'Copy prompt' }));

    expect(writeText).toHaveBeenCalledWith(PROMPT);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Prompt copied'));
  });

  it('reports a failure when the browser has no clipboard API', async () => {
    const user = setup({});

    await user.click(screen.getByRole('button', { name: 'Copy prompt' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Copy failed'));
  });

  it('opens the Markdown twin in a new tab from a labelled icon link', () => {
    setup();

    const link = screen.getByRole('link', { name: 'View as Markdown' });
    expect(link).toHaveAttribute('href', '/my-post.md');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('gives desktops a share menu with copy link and encoded network links', async () => {
    const user = setup();

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(screen.getByRole('button', { name: 'Share' })).toHaveAttribute('aria-expanded', 'true');
    const expected: Record<string, string> = {
      LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      X: `https://x.com/intent/post?url=${encoded}&text=${encodeURIComponent(TITLE)}`,
      Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      WhatsApp: `https://wa.me/?text=${encodeURIComponent(TITLE + ' ' + URL_UNDER_TEST)}`,
    };
    for (const [name, href] of Object.entries(expected)) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('rel', 'nofollow noopener noreferrer');
    }
    expect(screen.queryByRole('button', { name: 'More apps…' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(writeText).toHaveBeenCalledWith(URL_UNDER_TEST);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Link copied'));
    expect(screen.getByRole('button', { name: 'Share' })).toHaveFocus();
  });

  it('offers the native sheet as "More apps…" on desktops that support it', async () => {
    const share = stubNativeShare();
    const user = setup();

    await user.click(screen.getByRole('button', { name: 'Share' }));
    expect(share).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'More apps…' }));

    expect(share).toHaveBeenCalledWith({ title: TITLE, url: URL_UNDER_TEST });
  });

  it('opens the native sheet straight away on touch devices', async () => {
    stubPointer('coarse');
    const share = stubNativeShare();
    const user = setup();

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(share).toHaveBeenCalledWith({ title: TITLE, url: URL_UNDER_TEST });
    expect(screen.getByRole('button', { name: 'Share' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('falls back to the menu when the native sheet fails, but not when the reader cancels it', async () => {
    stubPointer('coarse');
    const share = stubNativeShare(vi.fn().mockRejectedValue(new DOMException('Share canceled', 'AbortError')));
    const user = setup();
    const shareButton = screen.getByRole('button', { name: 'Share' });

    await user.click(shareButton);
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(shareButton).toHaveAttribute('aria-expanded', 'false');

    share.mockRejectedValueOnce(new Error('Share failed'));
    await user.click(shareButton);
    await waitFor(() => expect(shareButton).toHaveAttribute('aria-expanded', 'true'));
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeVisible();
  });

  it('closes the menu with Escape and returns focus to the Share button', async () => {
    const user = setup();
    const shareButton = screen.getByRole('button', { name: 'Share' });

    await user.tab();
    expect(shareButton).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Copy link' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(shareButton).toHaveAttribute('aria-expanded', 'false');
    expect(shareButton).toHaveFocus();
  });
});

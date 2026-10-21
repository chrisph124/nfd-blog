import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostActions from '@/components/molecules/PostActions';

const URL_UNDER_TEST = 'https://www.notesof.dev/my-post';
const PROMPT = `Read ${URL_UNDER_TEST}.md and answer questions about it.`;

describe('PostActions', () => {
  let writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;

  beforeEach(() => {
    writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'share');
  });

  // userEvent.setup() installs its own clipboard stub, so ours replaces it afterwards.
  const setup = (clipboard: Partial<Clipboard> = { writeText }) => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
    render(<PostActions url={URL_UNDER_TEST} title="My post" />);
    return user;
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

  it('hands the title and canonical URL to the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const user = setup();

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(share).toHaveBeenCalledWith({ title: 'My post', url: URL_UNDER_TEST });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('copies the canonical URL when the browser has no share sheet', async () => {
    const user = setup();

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(writeText).toHaveBeenCalledWith(URL_UNDER_TEST);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Link copied'));
  });

  it('stays quiet when the reader cancels the share sheet', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('Share canceled', 'AbortError'));
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const user = setup();

    await user.click(screen.getByRole('button', { name: 'Share' }));

    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});

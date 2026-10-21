import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostActions from '@/components/molecules/PostActions';

const URL_UNDER_TEST = 'https://www.notesof.dev/my-post';
const MARKDOWN = '# My post\n\n```ts\nconst a = 1;\n```\n';
const PROMPT = `Read ${URL_UNDER_TEST}.md and answer questions about it.`;

describe('PostActions', () => {
  let writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;

  beforeEach(() => {
    writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(MARKDOWN, { status: 200 })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'share');
  });

  // userEvent.setup() installs its own clipboard stub, so ours replaces it afterwards.
  const setup = (clipboard: Partial<Clipboard> = { writeText }) => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
    render(<PostActions url={URL_UNDER_TEST} title="My post" />);
    return user;
  };

  const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'More actions' }));
  };

  it('copies the Markdown twin body, code fences included', async () => {
    const user = setup();

    await user.click(screen.getByRole('button', { name: 'Copy page' }));

    expect(fetch).toHaveBeenCalledWith('/my-post.md');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Page copied'));
    expect(writeText).toHaveBeenCalledWith(MARKDOWN);
  });

  it('starts the clipboard write before the Markdown arrives, as Safari requires', async () => {
    const pendingFetch: { resolve?: (response: Response) => void } = {};
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { pendingFetch.resolve = resolve; })));
    const items: Record<string, Promise<Blob>>[] = [];
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(data: Record<string, Promise<Blob>>) {
          items.push(data);
        }
      },
    );
    const write = vi.fn().mockResolvedValue(undefined);
    const user = setup({ write, writeText });

    await user.click(screen.getByRole('button', { name: 'Copy page' }));
    expect(write).toHaveBeenCalledTimes(1);

    pendingFetch.resolve?.(new Response(MARKDOWN, { status: 200 }));
    expect(await (await items[0]['text/plain']).text()).toBe(MARKDOWN);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Page copied'));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('reports a failed copy instead of claiming success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    const user = setup();

    await user.click(screen.getByRole('button', { name: 'Copy page' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Copy failed'));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('reports a failure when the browser has no clipboard API', async () => {
    const user = setup({});
    await openMenu(user);

    await user.click(screen.getByRole('button', { name: 'Copy link' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Copy failed'));
  });

  it('builds open-in links with the absolute, encoded Markdown URL', async () => {
    const user = setup();
    await openMenu(user);

    const expected: Record<string, string> = {
      ChatGPT: 'https://chatgpt.com/?q=',
      Claude: 'https://claude.ai/new?q=',
      Perplexity: 'https://www.perplexity.ai/search/new?q=',
      Grok: 'https://grok.com/?q=',
    };
    for (const [name, prefix] of Object.entries(expected)) {
      const link = screen.getByRole('link', { name: `Open in ${name}` });
      expect(link).toHaveAttribute('href', `${prefix}${encodeURIComponent(PROMPT)}`);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'nofollow noopener noreferrer');
    }
  });

  it('opens a provider without a prefill URL only after the prompt is copied', async () => {
    const tab = { opener: window } as unknown as Window;
    const open = vi.spyOn(window, 'open').mockReturnValue(tab);
    const user = setup();
    await openMenu(user);

    await user.click(screen.getByRole('button', { name: 'Copy prompt, open Gemini' }));

    expect(writeText).toHaveBeenCalledWith(PROMPT);
    await waitFor(() => expect(open).toHaveBeenCalledWith('https://gemini.google.com/app', '_blank'));
    expect(tab.opener).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Prompt copied. Paste it into Gemini.');
  });

  it.each(['Copy link', 'Share'])('%s copies the canonical URL when there is no share sheet', async (action) => {
    const user = setup();
    await openMenu(user);

    await user.click(screen.getByRole('button', { name: action }));

    expect(writeText).toHaveBeenCalledWith(URL_UNDER_TEST);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Link copied'));
  });

  it('hands the title and canonical URL to the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const user = setup();
    await openMenu(user);

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(share).toHaveBeenCalledWith({ title: 'My post', url: URL_UNDER_TEST });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('keeps keyboard focus on the toggle when the menu closes', async () => {
    const user = setup();
    const toggle = screen.getByRole('button', { name: 'More actions' });

    await user.tab();
    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Copy link' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  it('closes the menu when focus tabs out of it', async () => {
    const user = setup();
    await user.tab();
    await user.tab();
    await user.keyboard('{Enter}');
    const share = screen.getByRole('button', { name: 'Share' });
    share.focus();

    await user.tab();

    expect(screen.getByRole('button', { name: 'More actions' })).toHaveAttribute('aria-expanded', 'false');
  });
});

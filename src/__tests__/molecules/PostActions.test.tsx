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
  });

  // userEvent.setup() installs its own clipboard stub, so ours replaces it afterwards.
  const setup = () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<PostActions url={URL_UNDER_TEST} title="My post" />);
    return user;
  };

  it('copies the Markdown twin body, code fences included', async () => {
    const user = setup();

    await user.click(screen.getByRole('button', { name: 'Copy page' }));

    expect(fetch).toHaveBeenCalledWith('/my-post.md');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Page copied'));
    expect(writeText).toHaveBeenCalledWith(MARKDOWN);
  });

  it('hands Safari-style clipboards a pending blob that resolves to the Markdown body', async () => {
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
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { value: { write, writeText }, configurable: true });
    render(<PostActions url={URL_UNDER_TEST} title="My post" />);

    await user.click(screen.getByRole('button', { name: 'Copy page' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Page copied'));
    expect(write).toHaveBeenCalledTimes(1);
    expect(await (await items[0]['text/plain']).text()).toBe(MARKDOWN);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('reports a failed copy instead of claiming success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    const user = setup();

    await user.click(screen.getByRole('button', { name: 'Copy page' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Could not copy'));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('builds open-in links with the absolute, encoded Markdown URL', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'More actions' }));

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
    }
  });

  it('copies the prompt before opening a provider without a prefill URL', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'More actions' }));

    const gemini = screen.getByRole('link', { name: 'Open in Gemini' });
    expect(gemini).toHaveAttribute('href', 'https://gemini.google.com/app');
    await user.click(gemini);

    expect(writeText).toHaveBeenCalledWith(PROMPT);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Prompt copied. Paste it into Gemini.'),
    );
  });

  it('copies the canonical link, and Share falls back to that copy without a share sheet', async () => {
    const user = setup();

    for (const action of ['Copy link', 'Share']) {
      writeText.mockClear();
      await user.click(screen.getByRole('button', { name: 'More actions' }));
      await user.click(screen.getByRole('button', { name: action }));

      expect(writeText).toHaveBeenCalledWith(URL_UNDER_TEST);
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Link copied'));
    }
  });

  it('hands the title and canonical URL to the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const user = setup();

    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(share).toHaveBeenCalledWith({ title: 'My post', url: URL_UNDER_TEST });
    expect(writeText).not.toHaveBeenCalled();
    Reflect.deleteProperty(navigator, 'share');
  });

  it('opens and closes the menu from the keyboard and returns focus to the toggle', async () => {
    const user = setup();
    const toggle = screen.getByRole('button', { name: 'More actions' });

    await user.tab();
    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeVisible();

    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Copy link' })).not.toBeInTheDocument();
  });
});

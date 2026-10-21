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
